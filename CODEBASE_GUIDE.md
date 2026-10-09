# Incident Management App: Codebase Guide

This guide documents the repository as it exists now. It covers project-owned
source, configuration, migrations, static assets, and checked-in tool guidance.
It does not document the internal source of packages under `node_modules`, nor
does it attempt to explain every generated dependency entry in the Bun lockfiles.
Those files are package-manager output; their role and relationship to the
manifest are explained below.

The repository has two applications:

- `frontend/`: a Next.js App Router interface.
- `backend/`: an Express API, Prisma/PostgreSQL persistence, and Socket.IO.

The browser makes HTTP requests to the backend for durable reads and writes.
Socket.IO is a separate realtime notification channel; it tells clients when
they should refresh relevant HTTP-backed query data. The backend remains the
source of truth.

## 1. Repository map

```text
.
├── backend/
│   ├── .agents/skills/       Prisma guidance for agent tools
│   ├── .claude/skills/       Same Prisma guidance for Claude tooling
│   ├── .cursor/skills/       Same Prisma guidance for Cursor tooling
│   ├── .devin/skills/        Same Prisma guidance for Devin tooling
│   ├── prisma/               Schema, migrations, seed data, Prisma config
│   └── src/                  Express application source
└── frontend/
    ├── public/               Static SVG assets
    └── src/                  Next.js routes, components, API and state code
```

The repository root also contains `.env.example`, `.gitignore`,
`docker-compose.yml`, and this guide. There is no root package/workspace
manifest or root application entry point.

### Backend folders

| Folder | Purpose |
|---|---|
| `backend/src/config/` | Zod-validated environment configuration, production guardrails, and the shared CORS origin check. |
| `backend/src/controllers/` | HTTP request handlers. Controllers translate Express request data into service calls and HTTP responses. |
| `backend/src/infrastructure/websockets/` | Older/alternate WebSocket scaffolding. Its `websocket.server.ts` and `websocket.publisher.ts` files are empty; `websocket.types.ts` is not wired into the active Socket.IO path. |
| `backend/src/lib/` | Shared infrastructure helpers: JWT and Prisma clients. |
| `backend/src/middleware/` | Express authentication, role authorization, validation, and central error handling. |
| `backend/src/realtime/` | Active Socket.IO server, event names, payload and publisher helpers. |
| `backend/src/routes/` | Express router declarations and route-to-controller/middleware wiring. |
| `backend/src/services/` | Business logic and Prisma database access. |
| `backend/src/types/` | Express request type augmentation for authenticated users. |
| `backend/src/validation/` | Zod schemas used by backend routes. |
| `backend/tests/` | Present but contains no test files. |
| `backend/prisma/migrations/` | Ordered PostgreSQL DDL migrations and provider lock marker. |

### Frontend folders

| Folder | Purpose |
|---|---|
| `frontend/src/api/` | Browser-side API functions, data types, and Zod schemas. Despite its name, this is not a Next.js server API route folder. |
| `frontend/src/app/` | Next.js App Router route segments, layouts, global CSS, and favicon. |
| `frontend/src/components/auth/` | Authentication gate and role-conditional rendering helpers. |
| `frontend/src/components/dashboard/` | Present but currently has no component files. |
| `frontend/src/components/incidents/` | Incident form, severity/status labels, and status progress UI. |
| `frontend/src/components/realtime/` | Auth-aware provider that opens Socket.IO and installs realtime invalidation listeners. |
| `frontend/src/components/shell/` | Protected-app navigation, header, and command palette. |
| `frontend/src/components/ui/` | Reusable UI primitives built around Base UI or small native wrappers. |
| `frontend/src/hooks/dashboard/` | Dashboard TanStack Query hook. |
| `frontend/src/hooks/incidents/` | Incident query keys and incident/user query and mutation hooks. |
| `frontend/src/lib/api/` | Shared HTTP client and an empty `hooks/` placeholder folder. |
| `frontend/src/lib/auth/` | Browser auth context, persisted session, role predicates, and logout helpers. |
| `frontend/src/lib/realtime/` | Socket.IO singleton, event payload types, and query invalidation hook. |
| `frontend/public/` | Static starter SVG illustrations/logos. |

## 2. Runtime and request architecture

### Backend startup

The active backend entry point is `backend/src/server.ts`, run by the
`backend` package's `dev` script (`tsx watch src/server.ts`). It loads dotenv,
imports the Express app, creates a Node HTTP server, initializes Socket.IO on
that same HTTP server, and listens on the validated `PORT`. It also closes
Socket.IO, the notification queue, Redis and Prisma during SIGINT/SIGTERM
shutdown. This shared server is necessary because Socket.IO upgrades
connections through the HTTP server.

`backend/src/config/env.ts` parses and validates process configuration.
`backend/src/app.ts` sets proxy trust, request logging/metrics, Helmet,
allowlisted credentialed CORS, a 1 MiB JSON limit, liveness/readiness/metrics
routes and API rate limiting before feature routers; it mounts
`errorHandler` last. Express 5 passes rejected async route-handler promises to
error middleware; controllers also forward errors through `next(error)`.

`backend/index.ts` only prints a Bun greeting. It is not the API server entry
point despite the backend package's `module` field and old README startup
instructions. Use the `dev`/`start` scripts rather than assuming `index.ts`
starts the service.

### HTTP request and data path

For a typical authenticated incident operation:

1. A Next.js page calls a hook such as `useIncidents`, `useIncident`, or a
   mutation hook in `frontend/src/hooks/`.
2. The hook's query/mutation function calls a function in
   `frontend/src/api/incidents/incidents.ts`.
3. That function calls `apiClient` in `frontend/src/lib/api/client.ts`.
   The client adds JSON content type when there is a body, reads the browser
   session from local storage, adds the bearer token, sends `fetch`, handles
   `401`, parses JSON, and rejects non-2xx results.
4. The backend router matches the method and path. Authentication middleware
   checks the `Authorization: Bearer <token>` header; selected routes also
   validate inputs.
5. The controller extracts route/query/body/user data, invokes a service, and
   produces the HTTP response.
6. The service executes Prisma calls against PostgreSQL, often wrapping a
   durable write plus audit/timeline event in a Prisma transaction.
7. The controller serializes the resulting object or response shape. TanStack
   Query stores it under the query key; React renders the query result.
8. For realtime-enabled writes, the service publishes an event after the
   transaction. Connected clients invalidate query keys and refetch from the
   API. The event itself is not the canonical UI record.

Frontend API base URL is `NEXT_PUBLIC_API_URL`, defaulting in the HTTP client
to `http://localhost:3000/api/v1`. Backend uses `PORT` (default `3000`),
`DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGINS` (with a development fallback
to `http://localhost:3001`). Example templates are checked in; keep actual
secret-bearing `.env` files out of source control.

### API route table

All API routes are mounted under `/api/v1`.

| Method and path | Router/controller | Authentication / input notes |
|---|---|---|
| `POST /auth/register` | `auth.routes.ts` → `auth.controller.ts` → `auth.service.ts` | Public. Registration body is Zod-validated. |
| `POST /auth/login` | Same auth chain | Public. Login has an IP limiter and Zod body validation. |
| `GET /incidents` | `incident.routes.ts` → `getIncidentsController` | Router-wide bearer auth; query validated by `getIncidentsQuerySchema`. |
| `POST /incidents` | Same router → `createIncidentController` | Router-wide bearer auth; ADMIN/RESPONDER write authorization and Zod body validation. |
| `GET /incidents/stats` | Same router → dashboard controller/service | Router-wide bearer auth. |
| `GET /incidents/:id/events` | Same router → timeline controller/service | Router-wide bearer auth. |
| `GET /incidents/:id` | Same router → detail controller/service | Router-wide bearer auth. |
| `PUT /incidents/:id` | Same router → update controller/service | Router-wide auth, ADMIN/RESPONDER authorization, validated ID and body. |
| `PATCH /incidents/:id/status` | Same router → status controller/service | Router-wide auth, ADMIN/RESPONDER authorization, validated ID/status and allowed transitions. |
| `PATCH /incidents/:id/assign` | Same router → assignment controller/service | Router-wide auth, ADMIN/RESPONDER authorization, validated ID/user ID and existing target checks. |
| `POST /incidents/:id/comments` | `comment.routes.ts` → comment controller/service | Bearer auth; controller trims/requires nonempty content. |
| `GET /incidents/:id/comments` | Same comment chain | Bearer auth. |
| `GET /users` | `user.routes.ts` → user controller/service | Bearer auth. |
| `GET /users/:id` | Same user chain | Bearer auth. |
| `GET /notifications` | `notification.routes.ts` → notification controller | Bearer auth, but current controller reads a different request property than auth middleware writes; see pitfalls. |
| `GET /`, `/health`, `/health/live`, `/health/ready`, `/metrics` | `app.ts` → health controller | Public liveness/readiness; metrics requires bearer token in production. |

Current middleware details: all `/api/v1` routes are rate-limited; login has
an additional stricter IP limit. Incident writes and comment creation require
ADMIN/RESPONDER, while incident/user/comment reads require authentication.
All listed body and ID constraints are enforced by backend Zod validators.
`GET /notifications` scopes its query to `req.user.id`. `/health/live` is
liveness, `/health/ready` checks dependencies, and production `/metrics`
requires the configured bearer token.

### Feature flows

#### Register and sign in

1. The register or login page calls `AuthContext.register` or `.login`.
2. The auth context calls `apiClient` with `skipAuth: true` and receives a
   `{ user, token }` response.
3. It validates required response fields, stores `{ user, token }` under
   `incident-auth-session` in local storage, and updates React auth state.
4. The backend controller delegates to `auth.service.ts`.
5. Registration checks for an existing email, bcrypt-hashes the password at
   cost 10, creates a `VIEWER`, and signs a JWT. Login fetches the user and
   compares the password hash before signing a JWT.
6. The frontend routes the new session to the requested page or dashboard.

JWTs encode `userId` and `role`, expire after one hour, and use `JWT_SECRET`.
The HTTP auth middleware verifies the signature and attaches `req.user`.
Socket.IO has a separate handshake middleware that accepts a token from
`socket.handshake.auth.token` or an Authorization header and verifies it too.

#### List/search/filter incidents

The incidents page reads filters and page number from URL search parameters,
sanitizes invalid enum/page values, debounces the search value, creates
`IncidentListParams`, and calls `useIncidents`. The API helper encodes those
parameters into a query string. The backend `validateQuery` parses the query
using Zod coercion/defaults, stores the result in `res.locals.validatedQuery`,
and the controller calls `getIncidents`.

The service clamps page/limit, builds a Prisma `where` condition, performs
find/count in a transaction, includes selected assignee fields, and returns
pagination metadata. The controller responds with `{ success, data,
pagination }`. The UI renders badges and assignee details, supports sorting,
filtering, page changes, and create-dialog state in the URL.

#### Create an incident

The list's `IncidentFormDialog` or the separate `/incidents/new` screen collects
title, description and severity. The dialog uses React Hook Form plus
`incidentFormSchema`; the dedicated page uses local React state and checks a
nonblank title. Both call `useCreateIncident`, which sends `POST /incidents`.
The backend service inserts the incident and `CREATED` timeline row in one
transaction, then emits `incident.created`. The frontend mutation invalidates
incident list and dashboard queries; the realtime listener also invalidates
those keys for all connected clients. The controller returns the incident.

#### Read and edit incident details

The route `/incidents/[id]` reads `id` from Next navigation params and starts
four query groups: incident detail, comments, timeline, and users. It renders
loading/error/not-found states, incident summary, status stepper, description,
comments, timeline, assignment and metadata. Editing opens
`IncidentFormDialog` in edit mode.

Saving uses `useUpdateIncident(id)` → `PUT /incidents/:id` → update controller
→ `updateIncident` service. The backend updates the row and adds an `UPDATED`
timeline event in a transaction, then emits `incident.updated`. The initiating
client invalidates its list/detail/dashboard/timeline keys on mutation success;
other authenticated clients do so when their realtime listener receives the
event. The detail query uses `incidentKeys.detail(id)` and requests
`GET /incidents/:id`.

#### Status changes

The Details page computes the next step from `NEXT_STATUS` and calls
`useUpdateIncidentStatus`. The backend verifies the transition against
`allowedTransitions`, updates status and resolution time and adds the matching
timeline event in a transaction, then emits either `incident.status_changed`
or `incident.resolved`. The hook invalidates the local list/detail/dashboard/
timeline; the realtime hook invalidates those same categories in other tabs.

#### Assignment

The Details page loads users, presents a select control, and calls
`useAssignIncident` with the selected user ID. The backend verifies the
incident and target user, assigns within a transaction, adds an `ASSIGNED`
event and creates a notification for the target user. It then emits
`incident.assigned`. The frontend mutation and remote realtime listener
invalidate incident list/detail/dashboard/timeline data.

#### Comments and timeline

Submitting a nonblank comment calls `useAddIncidentComment` →
`POST /incidents/:id/comments`. The controller uses the authenticated actor ID
and the service first verifies the incident, then inserts the comment and a
`COMMENT_ADDED` timeline row in a transaction. The page's mutation success
invalidates comments, detail, dashboard and timeline keys.

The timeline endpoint reads `IncidentEvent` rows with user summary and returns
them oldest first. The Detail page maps event types to icons and displays
message, timestamp and actor. The comment service publishes
`incident.comment_added` only after the comment and timeline transaction
commits; remote clients invalidate comments, detail and timeline queries.

#### Dashboard

`useDashboardStats` calls `GET /incidents/stats` under key
`["dashboard", "stats"]`. The backend runs parallel Prisma queries for severity
and status aggregates, active/SEV1 counts, recently resolved incidents,
resolved durations, 14-day creation counts, top active incidents and recent
timeline activity. It formats those rows into one result object.
`dashboardStatsSchema` validates the returned shape on the frontend. The page
renders summary cards, a 14-day Recharts bar chart, severity/status breakdowns,
top active incidents and recent activity. Incident writes and relevant
realtime events invalidate the dashboard key.

#### Realtime event flow

1. `server.ts` attaches the active Socket.IO server to the backend HTTP server.
2. A browser with an auth token calls `connectSocket` from
   `frontend/src/lib/realtime/socket.ts`. The client URL is the origin of
   `NEXT_PUBLIC_API_URL`, not its `/api/v1` path.
3. Backend Socket.IO handshake authentication verifies the JWT. Connected
   sockets join a per-user room, but the current publisher uses `io.emit`,
   which broadcasts to all connected authenticated sockets rather than only
   that room.
4. An incident service commits its database transaction, then calls a
   publisher. The publisher emits a named event and a payload containing
   `incidentId` plus relevant data.
5. `AuthenticatedRealtimeProvider` obtains the token from auth context.
   `useRealtimeIncidents(token)` installs handlers before connecting, manages
   connection diagnostics/reconnect invalidation, and disconnects when the
   auth token changes or is cleared.
6. Incident events invalidate the list, matching detail/timeline, comments
   for comment events, and dashboard query keys. The Details page's
   `useIncident(id)` uses `incidentKeys.detail(id)`, causing an active query
   refetch and a UI rerender with API data.

This is an invalidation/refetch design, not direct event-payload cache writes.
It favors the backend API as canonical data but depends on the WebSocket event
being delivered, carrying the correct incident ID, and the page using the same
query key. There is no durable event replay in the client flow shown here.

## 3. Authentication, authorization, validation and errors

### Authentication

- Backend password storage uses bcrypt hashes; plaintext passwords are not
  stored in the User row.
- `generateToken` signs one-hour JWTs with `JWT_SECRET`.
- REST calls use a bearer token read from local storage by the frontend
  `apiClient`.
- `authenticate` verifies the REST token and attaches `{ id, role }` to
  `req.user`.
- Socket.IO independently verifies a handshake token. There is no shared
  HTTP session or cookie-based socket authentication.
- The frontend auth context restores local storage at client mount. The root
  layout is a client provider boundary for query/theme/auth/realtime state.

### Authorization

`role.middleware.ts` exports `authorize(...allowedRoles)`. Incident creation,
editing, status changes, assignment and comment creation allow only `ADMIN`
and `RESPONDER`; `VIEWER` is read-only. The frontend mirrors that policy in
its controls, but backend middleware is the enforcement boundary.

Socket connections require a valid token but have no role-based event filters.
Since `io.emit` broadcasts globally, every authenticated socket can receive
all incident realtime payloads. Review this before treating the WebSocket
channel as data-isolated by user or team.

### Validation

- `incident.validation.ts` defines auth, incident write, status, assignment,
  comment, ID-param and list-query schemas.
- `validateBody`, `validateParams` and `validateQuery` return structured 400
  details. Parsed bodies replace `req.body`; params/query data is stored in
  `res.locals` (queries under `validatedQuery`).
- Frontend registration and incident-form schemas use Zod; these improve user
  feedback but do not replace backend validation.
- The status service checks allowed transitions; assignment service checks
  target existence.

### Errors

`error.middleware.ts` adds request IDs to structured request/error logs and
maps `HttpError`, Zod, malformed JSON and common Prisma conflict/not-found/
relation errors to a consistent response envelope. Unexpected server errors
are sent to Sentry when configured. Controllers forward errors to the central
handler. The frontend API client
turns non-success responses into `Error` objects, clears local session on
401, redirects to login, and throws so query/mutation consumers can render or
toast an error.

Potential response-shape inconsistencies are important: some backend endpoints
return raw records, while others wrap them in objects such as `{ events }`,
`{ comments }`, or `{ success, data, pagination }`. Frontend API functions
expect those shapes and can silently misbehave if a controller shape changes
without updating its corresponding type/function.

## 4. Background processing and external services

BullMQ backs an assignment-email notification queue; the standalone
`backend/src/workers/notification.worker.ts` processes jobs. Email delivery is
disabled by default and requires SMTP configuration when enabled. Database
assignment commits before best-effort email enqueueing and event publishing.
Realtime publishing is in-process after the database transaction, not an
outbox or durable message queue.

External libraries/services directly present in the manifests and source:

- PostgreSQL via `pg`, Prisma Client and `@prisma/adapter-pg`.
- Express 5 and Node HTTP for REST/server lifecycle.
- Socket.IO server/client for realtime transport.
- JWT (`jsonwebtoken`) and bcrypt for authentication/password handling.
- Zod for runtime parsing/validation.
- Pino/pino-http for structured logs, Prometheus client for HTTP/dependency/
  queue/WebSocket metrics, and optional Sentry error capture.
- Helmet and Redis-backed `rate-limiter-flexible` for common HTTP protections.
- Next.js, React, TanStack Query, React Hook Form, Base UI, `cmdk`, Recharts,
  Tailwind CSS and Sonner for frontend routing, state, forms, UI and charts.
- `dotenv` loads backend environment variables.

No object-storage integration is configured. Nodemailer can deliver queued
email when explicitly enabled and configured.

## 5. Backend file-by-file reference

### Backend project and Prisma files

| File | What it does |
|---|---|
| `backend/package.json` | Declares ESM package metadata, scripts and dependencies. `dev` runs `tsx watch src/server.ts`; `build` invokes TypeScript; `start` expects compiled `dist/server.js`; `postinstall` attempts Prisma skill sync but intentionally exits successfully on sync failure. |
| `backend/bun.lock` | Bun's resolved backend dependency graph. It pins selected versions/integrity and should change through Bun when manifests change, not be hand-edited. |
| `backend/tsconfig.json` | Strict TypeScript, NodeNext module resolution, `src` as root and `dist` as output. `include` contains `src`; root `index.ts` is not part of this compile configuration. |
| `backend/prisma.config.ts` | Loads dotenv, points Prisma to `prisma/schema.prisma`, sets migration directory and Bun seed command, and reads `DATABASE_URL`. |
| `backend/prisma/schema.prisma` | Defines PostgreSQL provider and generated client; models User, Incident, IncidentComment, IncidentEvent and Notification; relations, defaults, indexes and enum sets. It is the Prisma data contract. |
| `backend/prisma/migrations/20260930091053_init/migration.sql` | Initial SQL schema for roles, incidents, comments, events, indexes and foreign keys. |
| `backend/prisma/migrations/20260930095616_add_notifications/migration.sql` | Adds notification enum/table, query indexes and user/incident foreign keys. |
| `backend/prisma/migrations/migration_lock.toml` | Prisma's migration provider marker (`postgresql`); generated migration metadata, not application logic. |
| `backend/prisma/seed.ts` | Creates/upserts sample users, creates example incidents, comments, timeline events and notifications, prints test accounts, and disconnects Prisma in `finally`. It is data setup, not a runtime worker. The seeded example password is for development/demo use only. |
| `backend/index.ts` | Bun initialization placeholder that only logs a greeting. It does not start Express or Socket.IO. |
| `backend/README.md` | Documents local API/worker startup, migration commands and local Compose usage; clarifies that `index.ts` is not the server. |
| `backend/.gitignore` | Ignores dependencies, build output, coverage, dotenv files, caches, logs and editor/OS files. |
| `backend/.env.example` | Safe development environment template; it contains placeholders, not working production secrets. |
| `backend/Dockerfile` | Multi-stage Bun image; generates Prisma Client, compiles TypeScript and runs the API/worker as the non-root `bun` user. |
| `backend/.dockerignore` | Excludes local secrets, dependencies and generated output from Docker build context. |

### Backend application, routing and middleware files

| File | What it does and how it connects |
|---|---|
| `backend/src/app.ts` | Creates the Express app; installs request logging/metrics, Helmet, allowlisted CORS and bounded JSON parsing; exposes health/metrics endpoints; applies API rate limiting; mounts feature routers; installs central errors last. |
| `backend/src/server.ts` | Loads dotenv, creates Node HTTP server from Express, initializes active Socket.IO, listens on validated `PORT`, and gracefully closes Socket.IO, queue, Redis and Prisma on shutdown. |
| `backend/src/routes/auth.routes.ts` | Public `POST /register` with registration validation and `POST /login` with login rate limit plus validation. |
| `backend/src/routes/incident.routes.ts` | Applies `authenticate` to incident routes; wires create/list/stats/timeline/detail/update/status/assignment controllers with Zod validation and ADMIN/RESPONDER write authorization. |
| `backend/src/routes/comment.routes.ts` | Adds authenticated create/list comment endpoints under `/incidents/:id/comments`; validates ID/content and restricts writes to ADMIN/RESPONDER. |
| `backend/src/routes/user.routes.ts` | Adds authenticated user-list and validated user-by-ID routes. |
| `backend/src/routes/notification.routes.ts` | Applies authentication to notification routes and maps `GET /` to notification controller. |
| `backend/src/middleware/auth.middleware.ts` | Parses `Bearer` header, verifies only HS256 JWTs, validates user ID/role claims, sets `req.user`, and sends missing/invalid/expired token errors to central handling. |
| `backend/src/middleware/role.middleware.ts` | Exports `authorize` and forwards 401/403 `HttpError`s to central error handling; incident write routes allow only ADMIN/RESPONDER. |
| `backend/src/middleware/validate.middleware.ts` | Safe-parses body/params/query with Zod; body receives parsed data, query data is in `res.locals.validatedQuery`, and invalid input returns structured 400 details. |
| `backend/src/middleware/error.middleware.ts` | Final Express error handler; maps `HttpError`, Zod, malformed JSON and known Prisma cases to a consistent response, logs with request ID, and captures unexpected errors with optional Sentry. |
| `backend/src/validation/incident.validation.ts` | Declares Zod schemas for auth, incident create/update/status/assignment, comments, ID params and incident-list queries. |
| `backend/src/types/express.d.ts` | Augments Express `Request` with optional authenticated `{ id, role }`, where role is the `ADMIN`, `RESPONDER`, or `VIEWER` union. |

### Backend controller files

Controllers are the HTTP boundary: they read Express values, call services and
choose response status/body.

| File | Main blocks and connections |
|---|---|
| `backend/src/controllers/auth.controller.ts` | `register` reads validated name/email/password and calls `registerUser`, returning 201; `login` calls `loginUser`, returning 200. Failures reach the central handler. |
| `backend/src/controllers/incident.controller.ts` | Create/list/detail/update/status/assignment controller functions call matching services. List reads parsed query from `res.locals`; errors are forwarded centrally and missing detail is a 404. |
| `backend/src/controllers/comment.contoller.ts` | Spelled `contoller` in the actual path. `addComment` uses the validated content and authenticated actor ID, returning the created comment; `getComments` returns `{ comments }`. Errors reach central handling. |
| `backend/src/controllers/dashboard.controller.ts` | Calls dashboard stats service and forwards exceptions to central middleware. |
| `backend/src/controllers/timeline.controller.ts` | Calls timeline service for `req.params.id` and responds `{ events }`; forwards exceptions centrally. |
| `backend/src/controllers/user.controller.ts` | `getUsers` returns `{ users }`; `getUser` validates param type, returns 404 if absent, otherwise `{ user }`; both locally log/map errors. |
| `backend/src/controllers/notification.controller.ts` | Queries the authenticated user's notifications ordered newest first and forwards errors centrally. |

### Backend services and shared libraries

| File | Main blocks and connections |
|---|---|
| `backend/src/services/auth.service.ts` | Registration checks email uniqueness, bcrypt-hashes, creates `VIEWER`, signs token and returns safe user summary plus token. Login looks up email, compares bcrypt hash and returns the same response shape; both invalid credential paths use a generic message. |
| `backend/src/services/incident.service.ts` | Owns incident business rules and Prisma access. Defines status/severity/notification unions and legal transition map. Create/update write incident and timeline event transactionally, then publish realtime events. Listing builds search/filter/sort pagination and includes assignee summary. Detail performs `findUnique`. Status validates existence/current transition, updates resolution timestamp and timeline event transactionally, then publishes status/resolved event. Assignment validates incident/user, updates assignment, event and notification in a transaction, then publishes. |
| `backend/src/services/comment.service.ts` | Checks incident existence, transactionally inserts comment with user summary and timeline event, publishes `incident.comment_added` after commit, and reads comments oldest-first with user summary. |
| `backend/src/services/timeline.service.ts` | Reads incident events by incident ID, includes limited user fields and orders ascending by creation time. |
| `backend/src/services/dashboard.service.ts` | Runs aggregate and listing queries concurrently; creates UTC 14-day buckets, counts incidents by day, computes nonnegative mean resolution duration, and builds dashboard response sections. |
| `backend/src/services/user.service.ts` | Reads users in descending creation order or by ID, selecting public fields only (no password hash). |
| `backend/src/services/notification.service.ts` | Defines notification type and small `createNotification` helper; accepts an injectable database client so assignment can use its transaction client. |
| `backend/src/services/email.service.ts` | Configures Nodemailer lazily from validated SMTP settings; email is optional and does not log message body or recipient. |
| `backend/src/queues/notification.queue.ts` | Defines the BullMQ notification queue and stable notification job IDs, retry/backoff/removal settings, and enqueue helper. |
| `backend/src/queues/notification.types.ts` | Shares queue name, worker heartbeat key and email-job type without importing a Queue as a side effect. |
| `backend/src/workers/notification.worker.ts` | Processes email jobs, verifies optional SMTP transport, writes a Redis heartbeat only after BullMQ is ready, logs failures, and handles graceful shutdown. |
| `backend/src/lib/prisma.ts` | Loads dotenv, creates Prisma Postgres adapter from `DATABASE_URL`, exports singleton `PrismaClient`. |
| `backend/src/lib/jwt.ts` | Signs one-hour HS256 JWTs using validated `JWT_SECRET`; verification explicitly permits HS256 only. |
| `backend/src/lib/logger.ts` | Configures Pino level, service/environment fields and secret redaction for application logs. |
| `backend/src/lib/metrics.ts` | Defines the Prometheus registry, HTTP counters/histogram and dependency/queue/WebSocket gauges. |
| `backend/src/lib/sentry.ts` | Initializes Sentry only when `SENTRY_DSN` is configured and disables automatic tracing by default. |
| `backend/src/lib/redis.ts` | Creates the shared Redis client for API rate limiting and queue/worker configuration, with bounded retry behavior and connection logs. |
| `backend/src/controllers/health.controller.ts` | Implements liveness, dependency readiness, optional worker heartbeat checks, token-protected production metrics access and Prometheus exposition. |
| `backend/src/middleware/request-logging.middleware.ts` | Adds request IDs and structured HTTP request logging while removing query strings and sensitive headers from serialized request data. |
| `backend/src/middleware/metrics.middleware.ts` | Measures completed HTTP request count and duration with normalized route/status labels. |
| `backend/src/middleware/rate-limit.middleware.ts` | Creates Redis-backed general API and login limiters, returns 429 with retry timing, and fails closed with 503 if Redis protection is unavailable. |
| `backend/src/lib/http-error.ts` | Shared typed HTTP error carrying status, code and optional details for central response mapping. |

### Active and inactive WebSocket files

| File | What it does |
|---|---|
| `backend/src/realtime/socket.ts` | Active Socket.IO server singleton. Authenticates handshake using JWT, stores user in socket data, configures CORS origin, joins `user:<id>` room and logs connects/disconnects/errors. Exports initializer and guarded `getIO`. |
| `backend/src/realtime/events.ts` | Active string constants for six incident events and payload interface (`incidentId` plus optional incident/user/status/assignee/comment). |
| `backend/src/realtime/publisher.ts` | Active publishers. A shared function gets the Socket.IO server and `io.emit`s named event plus payload. Because it uses global emit, the joined per-user rooms currently do not restrict recipients. |
| `backend/src/infrastructure/websockets/websocket.types.ts` | Alternate typed event envelope with event type, incident ID, actor ID, timestamp and data. It does not match the active publisher payload exactly and has no runtime references found in the application path. |
| `backend/src/infrastructure/websockets/websocket.server.ts` | Empty file; no active server implementation. |
| `backend/src/infrastructure/websockets/websocket.publisher.ts` | Empty file; no active publishing implementation. |

## 6. Frontend file-by-file reference

### Frontend project/configuration files

| File | What it does |
|---|---|
| `frontend/package.json` | Next dev/build/start, ESLint and TypeScript scripts; declares React/Next, TanStack Query, form, chart, UI, Socket.IO and utility packages. Bun is the declared package manager. |
| `frontend/bun.lock` | Resolved package versions and integrity metadata for the frontend workspace. Let Bun update this when dependency manifests change. |
| `frontend/tsconfig.json` | Strict TypeScript, JSX transform, Next plugin and `@/*` alias to `src/*`; includes TS/TSX and generated Next types while excluding `node_modules`. |
| `frontend/next.config.ts` | Typed Next configuration object; currently contains no project-specific options. |
| `frontend/postcss.config.mjs` | Registers Tailwind CSS v4's PostCSS plugin. |
| `frontend/eslint.config.mjs` | Composes Next core-web-vitals and TypeScript ESLint configs and ignores build/generated output. |
| `frontend/components.json` | shadcn configuration: Base style, Tailwind CSS file, aliases, Lucide icon library and RTL setting. It supports component tooling; it is not a runtime router. |
| `frontend/.gitignore` | Ignores package installs, Next output, coverage, environment-local files, Vercel metadata, TS build info and editor/OS files. |
| `frontend/README.md` | Unmodified create-next-app starter instructions. Its generic port guidance says 3000, while this package's actual `dev` script binds Next to 3001. |
| `frontend/AGENTS.md` | Next.js-specific instruction that this installed Next version may differ from remembered APIs and directs agents to the installed docs before code changes. |
| `frontend/CLAUDE.md` | Local tooling guidance preferring Bun. Some examples advocate a Bun-native replacement stack, but the actual app uses Next.js and Express; treat code/manifests as authoritative. |

### App Router files

| File | What it does |
|---|---|
| `frontend/src/app/layout.tsx` | Root server layout; imports global CSS, renders `<html lang="en">`, suppresses hydration warning and wraps all routes in client `Providers`. |
| `frontend/src/app/page.tsx` | Root route redirects to `/dashboard`. Old starter/demo implementations remain commented out and do not execute. |
| `frontend/src/app/globals.css` | Imports Tailwind, declares light/dark design tokens, maps tokens into Tailwind theme, sets base document/font/focus styles, and adds visual utility classes and reduced-motion behavior. |
| `frontend/src/app/favicon.ico` | Browser tab/app icon static asset. |
| `frontend/src/app/(auth)/login/page.tsx` | Login route. Reads auth context, email/password state, query redirect parameter, submits login, displays errors/toasts, toggles password visibility, and uses Suspense around `useSearchParams`. |
| `frontend/src/app/(auth)/register/page.tsx` | Registration route. React Hook Form plus resolver validates name/email/password/confirmation, calls auth context, displays result toast, then routes to dashboard. A small `FormField` renders labels and field errors. |
| `frontend/src/app/(protected)/layout.tsx` | Shared protected shell. Holds mobile sidebar and command-palette state, registers/removes Cmd/Ctrl-K handler, gates children with `AuthGuard`, renders sidebar/header/main and palette. |
| `frontend/src/app/(protected)/dashboard/page.tsx` | Dashboard query screen, loading skeleton, retryable error state, aggregate cards, Recharts daily graph, severity/status summaries, top-active list and recent activity. `StatCard` and `formatDuration` are local presentation helpers. |
| `frontend/src/app/(protected)/incidents/page.tsx` | Incident list screen. URL parameters are source of filter/sort/page state; helper parses page and another debounces search. Uses incident/user queries, filter/sort controls, result table and pagination, then presents create dialog based on `?create=1`. |
| `frontend/src/app/(protected)/incidents/new/page.tsx` | Separate create form route using local state and `useCreateIncident`; validates title, shows toast and navigates back after success. |
| `frontend/src/app/(protected)/incidents/[id]/page.tsx` | Dynamic incident detail screen. Fetches incident/comments/timeline/users; handles loading, error and missing record; renders status, description, comment form, timeline, assignment, metadata and edit/status actions. |
| `frontend/src/app/(protected)/settings/team/page.tsx` | Placeholder Team Settings page whose text says management is planned for Phase 11. |

There is no `frontend/src/app/(protected)/notifications/page.tsx` in the
inventory even though the sidebar links to `/notifications` and the backend
offers a notification endpoint. There is no frontend notification feature route
implemented in the current source.

### Frontend API schemas, types and functions

| File | What it does |
|---|---|
| `frontend/src/api/auth/register-schema.ts` | Zod registration schema: trimmed required name, email format, minimum password length and confirmation equality. Exports inferred `RegisterFormValues`. |
| `frontend/src/api/incidents/types.ts` | Shared frontend unions and record/response types for severity, status, roles, sorting, incident, pagination, comments, events, users and CRUD inputs. Compile-time types only; they do not validate server responses by themselves. |
| `frontend/src/api/incidents/incident-form-schema.ts` | Zod form schema requiring a trimmed title, string description and severity enum or empty string for default. |
| `frontend/src/api/incidents/incidents.ts` | HTTP wrappers for incident list/detail/create/update/status/assignment, comments, events and users. `buildQueryString` serializes supported list params. Response wrappers are normalized where needed (e.g. status update extracts nested `incident`). |
| `frontend/src/api/dashboard/stats-schema.ts` | Zod runtime schema for dashboard payload, nested counts/lists, role/status/severity enums and exact 14-day array length. |
| `frontend/src/api/dashboard/dashboard.ts` | Defines shared `dashboardStatsKey`, requests `/incidents/stats` as unknown, then parses with runtime schema. |
| `frontend/src/lib/api/client.ts` | Shared `fetch` wrapper. Resolves API base from public env/default, handles request options and JSON headers, attaches stored bearer token unless skipped, clears/redirects on 401, parses JSON, throws server message for non-2xx and returns typed data. |

### Frontend query hooks

| File | What it does |
|---|---|
| `frontend/src/hooks/incidents/use-incidents.ts` | Defines hierarchical query keys (`all`, `lists`, `list`, `details`, `detail`, comments and timeline), read hooks for incidents/users/comments/timeline, and create/update/status/assignment/comment mutation hooks. Mutation success invalidates related caches. |
| `frontend/src/hooks/dashboard/use-dashboard-stats.ts` | TanStack Query hook reading dashboard statistics with shared dashboard key and API function. |
| `frontend/src/lib/api/hooks/` | Empty placeholder directory; no hook implementation is present there. |

### Frontend authentication files

| File | What it does |
|---|---|
| `frontend/src/lib/auth/session.ts` | Defines role/user/session types and local-storage operations for `incident-auth-session`; safely returns no session during server rendering and removes malformed JSON; clear also expires a same-named cookie. |
| `frontend/src/lib/auth/auth-context.tsx` | React auth provider/context. Restores session at mount, validates auth responses, stores sessions, exposes login/register/logout and role helper. Realtime connection ownership is in the separate authenticated realtime provider, avoiding socket setup inside auth mutations. |
| `frontend/src/lib/auth/permissions.ts` | Pure `canAccess` helper accepting nullable role and one/many allowed roles. |
| `frontend/src/lib/auth/use-can.ts` | Reads auth user and exposes callback `can` plus boolean convenience flags for each role. |
| `frontend/src/lib/auth/use-logout.ts` | Returns logout callback that clears auth, clears TanStack cache and routes to login. |
| `frontend/src/components/auth/auth-guard.tsx` | Protected-route client gate; waits for auth restoration, redirects unauthenticated visitors with current path encoded, and renders no protected children before auth. |
| `frontend/src/components/auth/can.tsx` | Declarative role-conditioned rendering with optional fallback. It only hides UI and must not replace backend authorization. |

### Frontend providers and realtime files

| File | What it does |
|---|---|
| `frontend/src/components/providers.tsx` | Creates one `QueryClient` via lazy `useState`; defaults queries to 30-second stale time and disables focus refetch; nests ThemeProvider, AuthProvider, AuthenticatedRealtimeProvider and Sonner Toaster. |
| `frontend/src/components/realtime/authenticated-realtime-provider.tsx` | Reads the token from `useAuth` and mounts `useRealtimeIncidents` inside the existing query/auth provider tree. |
| `frontend/src/components/realtime/realtime-provider.tsx` | Effect calls `connectSocket` when token exists, disconnects when absent, registers connect/disconnect/connect_error logging and removes those lifecycle listeners on cleanup. It invokes `useRealtimeIncidents(token)` as a sibling hook. |
| `frontend/src/lib/realtime/socket.ts` | Maintains one module-level Socket.IO client. Validates `NEXT_PUBLIC_API_URL`, uses its origin as Socket.IO URL, configures manual connect, websocket transport and handshake token, then exposes connect/disconnect/existing-socket functions. |
| `frontend/src/lib/realtime/event.ts` | Frontend event string constants and `IncidentRealtimePayload` shape. Constants should match backend `realtime/events.ts`. |
| `frontend/src/lib/realtime/use-realtime-incidents.ts` | Effect exits without token, reads existing singleton socket, logs if absent, registers handlers for six incident event names, and invalidates query keys. `incident.updated` invalidates list, detail keyed by payload `incidentId`, timeline and dashboard. Cleanup unregisters exact handlers. |

### Frontend presentation components and utilities

| File | What it does |
|---|---|
| `frontend/src/components/incidents/incident-form-dialog.tsx` | Reusable create/edit dialog. Resets React Hook Form when opened, validates schema, selects create/update mutation from mode, trims optional values, reports success/failure with toast and calls close/success callbacks. |
| `frontend/src/components/incidents/severity-badge.tsx` | Maps severity union to label/color classes and combines with optional class names using `cn`. |
| `frontend/src/components/incidents/status-badge.tsx` | Maps status union to readable label/color classes; adds check icon for resolved state. |
| `frontend/src/components/incidents/status-stepper.tsx` | Renders fixed status order, current/completed state, step labels and completion checkmarks. |
| `frontend/src/components/shell/sidebar.tsx` | Renders fixed navigation links/icons, active state from pathname, mobile visibility classes and close callback. Includes a Notifications link even though there is no matching page file. |
| `frontend/src/components/shell/header.tsx` | Renders mobile menu, search/shortcut button and account menu with user name/role/logout. An older commented menu variant remains. |
| `frontend/src/components/shell/command-palette.tsx` | Dialog-based command list for incident navigation/create and logout. Search input is provided by the primitive; current command items are fixed actions rather than API-powered incident search. |
| `frontend/src/components/ui/button.tsx` | Wraps Base UI Button with CVA variant/size class definitions and `cn` merging. |
| `frontend/src/components/ui/command.tsx` | Wraps `cmdk` command root/input/list/group/item and composes Dialog and InputGroup for command palette. Exports supporting separator/shortcut primitives too. |
| `frontend/src/components/ui/dialog.tsx` | Wraps Base UI dialog root, triggers, portals, backdrop, popup, close, header/footer/title/description. Applies consistent styling and optional close control. |
| `frontend/src/components/ui/dropdown-menu.tsx` | Wraps Base UI menu roots, portal, positioning, item/group/label, submenu, checkbox/radio/separator/shortcut primitives with styling. |
| `frontend/src/components/ui/input.tsx` | Thin Base UI input wrapper, adds slot and consistent form/focus/error styles. |
| `frontend/src/components/ui/input-group.tsx` | Input-group layout/addon wrappers; uses CVA for addon alignment; includes group button, text, input and textarea. Addon click focuses the adjacent input unless a button was clicked. |
| `frontend/src/components/ui/separator.tsx` | Base UI separator with horizontal/vertical styling. |
| `frontend/src/components/ui/textarea.tsx` | Native textarea wrapper with slot and consistent form/focus/error styling. |
| `frontend/src/components/ui/tooltip.tsx` | Base UI tooltip provider/root/trigger/popup wrappers; popup handles portal positioning, defaults and arrow. |
| `frontend/src/lib/utils.ts` | Re-exports `cn` from the installed `cn` package for the project alias. |
| `frontend/src/components/dashboard/` | Empty directory; current dashboard implementation is directly in the route page. |

### Static assets

`frontend/public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, and
`window.svg` are static SVG files inherited from starter scaffolding or
illustrative assets. They are served from the site root by Next.js when used.
They are not part of the active incident data flow. `frontend/src/app/favicon.ico`
is the application favicon.

## 7. Shared UI primitive implementation notes

The `components/ui` files are project wrappers, not application features on
their own. They follow a repeated pattern:

- Import a Base UI primitive, `cmdk`, React types or class helpers.
- Accept the upstream primitive's props, often removing or refining a small
  number of properties.
- Add `data-slot` attributes so Tailwind selectors can style parent/child
  relationships.
- Merge defaults and caller classes with `cn`.
- Export named wrapper components used by feature pages.

`button.tsx` additionally uses `class-variance-authority` to define
`variant`/`size` type-safe options. `dialog.tsx` owns portal/backdrop/popup
composition. `command.tsx` composes the dialog and input-group wrappers.
`dropdown-menu.tsx` exposes numerous menu variants, even if every export is
not currently used. This is a UI-library boundary that lets feature pages
avoid repeating accessibility, overlay and primitive wiring.

## 8. Data model and persistence design

- **User** owns incidents created, incidents assigned, comments, timeline
  events and notifications. Email is unique; `passwordHash` is private.
- **Incident** stores title, optional description, severity, lifecycle status,
  creation/update/resolution times and creator/assignee foreign keys.
- **IncidentComment** belongs to incident and author; deleting an incident
  cascades comments.
- **IncidentEvent** is the audit/timeline stream. It stores typed event,
  message, timestamp, incident and optional actor; the incident/time compound
  index supports timeline reads.
- **Notification** belongs to a user and optionally an incident; read state
  and indexes support user inbox lookups.
- Enums constrain roles, incident severity/status, timeline event types and
  notification types at the database layer.

Prisma relation names disambiguate User-to-Incident created-by versus
assigned-to relations. Service methods use transactions when a domain write
must stay consistent with its timeline entry (and assignment notification).
Realtime is published after a successful transaction, but is not transactional
with it: a server failure after commit or an event delivery failure can leave
clients stale until some later refetch.

## 9. Configuration and dependency decisions

### Backend

- `express` provides REST routing/middleware; `node:http` lets Express and
  Socket.IO share one listening server.
- `@prisma/client`, `prisma`, `@prisma/adapter-pg`, and `pg` implement typed DB
  access through PostgreSQL adapter.
- `prisma.config.ts` is required for the current Prisma CLI config model and
  declares schema/migration/seed locations.
- `dotenv/config` is loaded in server/Prisma entry modules; the JWT module
  also reads its secret when imported.
- `tsx watch` is the dev runner; compiled `dist` is the production start
  target; the Docker runtime executes that compiled output with Bun.
- Helmet, allowlisted CORS, JSON request-size limits, Redis-backed rate
  limiting and Zod validators are installed in the Express path.
- Pino/pino-http provide structured application and request logs;
  `prom-client` exposes HTTP/dependency/queue/WebSocket metrics; Sentry is
  optional. Production env parsing requires a strong JWT secret, explicit
  CORS origins and a metrics bearer token.
- Root `docker-compose.yml` prepares local PostgreSQL/Redis plus API/worker.
  The `migrate` service is under the `tools` profile and must be run
  explicitly before starting against a new database. There is no cloud
  deployment workflow.
- Root `.env.example` supplies local Compose variables; `frontend/.env.example`
  documents the API base and realtime flag. Root `.gitignore` protects local
  env files and root dependency output. Compose host ports bind to loopback.

### Frontend

- Next App Router provides route grouping and server/client component
  boundaries. Interactive pages/providers include `"use client"`.
- `@/*` resolves into `frontend/src/*`.
- TanStack Query owns remote data cache and invalidation.
- `react-hook-form` plus `@hookform/resolvers` is used for registration and
  the shared incident dialog; the dedicated new-incident route instead uses
  component state.
- Tailwind v4 tokens/classes are authored in `globals.css`; PostCSS enables
  its plugin.
- Recharts visualizes dashboard data; Zod validates dashboard API response at
  runtime.
- `next-themes` is configured for class-based dark mode. Providers default to
  dark and disable system selection.
- The HTTP client and Socket.IO URL use public environment configuration; a
  wrong API URL can break REST and realtime differently because the HTTP
  client expects a path-bearing base URL while the socket code extracts its
  origin.
- `socket.io-client` is a direct frontend dependency; the auth-aware provider
  connects only while a bearer token is present and reacts to reconnections by
  refetching relevant cached resources.

The frontend manifest also contains dependencies not referenced by the
application source inventory (for example `zustand`, `date-fns`, `motion`,
`nuqs`, and `@tanstack/react-table`). Their presence in `package.json` does not
mean the current feature path depends on them.

## 10. Tooling guidance and generated/reference files

The following eight skill files exist under `backend/.agents/`,
`.claude/`, `.cursor/`, and `.devin/`:

- `skills/prisma-composer-core-concepts/SKILL.md`
- `skills/prisma-platform-core-concepts/SKILL.md`

There are four copies of each skill, one per assistant/tool directory. The
copies with the same basename have matching contents. They are third-party
tooling guidance delivered with Prisma tooling, not application modules:

- **Composer core concepts** discusses Prisma Composer service/module
  declarations, ports, dependency wiring, building and testing.
- **Platform core concepts** discusses Prisma platform hosting, environments,
  services, databases, variables, deployment and operations.

No Composer app declaration or platform deployment configuration was found in
this repository, and the active application uses its own Express server plus
PostgreSQL connection settings. These skill documents therefore explain
possible tooling concepts, not the architecture actually wired by this code.

The frontend `AGENTS.md` and backend `CLAUDE.md` are agent instructions.
`backend/CLAUDE.md` prefers Bun and suggests a Bun-native stack, but actual
backend code is Express. The actual code and package manifests are the
reliable description of runtime behavior.

## 11. Important assumptions and pitfalls

1. **No root workspace command:** Run package scripts from the relevant app
   directory. Frontend development binds to 3001; backend defaults to 3000.
2. **Environment must be present:** Backend needs a valid `DATABASE_URL` and
   `JWT_SECRET`; frontend normally needs `NEXT_PUBLIC_API_URL` to point at the
   backend API base (default is localhost:3000/api/v1). Socket.IO derives only
   the origin from that URL. The checked-in examples are templates only.
3. **Global event scope:** sockets are authenticated but `io.emit` broadcasts
   each incident event to all authenticated connections. This matches the
   single shared-workspace assumption, not tenant isolation.
4. **Realtime is not durable:** Socket.IO messages are hints; a disconnected
   client receives no replay. The client invalidates relevant queries after
   reconnection, and API refetch remains canonical.
5. **Queue delivery is best-effort:** assignment commits before email enqueue.
   Queue/SMTP errors are logged, but no outbox currently guarantees eventual
   delivery. `QUEUE_WORKER_REQUIRED=true` makes readiness require its heartbeat.
6. **Health checks differ:** `/health/live` reports process liveness;
   `/health/ready` checks PostgreSQL, Redis, queue, Socket.IO, and optionally
   the worker. Prometheus `/metrics` requires a bearer `METRICS_TOKEN` in
   production.
7. **Production env guardrails:** production requires a JWT secret of at least
   32 characters, explicit `CORS_ORIGINS`, and a metrics token of at least 24
   characters. Email-enabled mode requires SMTP host/user/password.
8. **Compose is local preparation:** root `docker-compose.yml` binds
   PostgreSQL/Redis on 5433/6380 by default to avoid common local service
   ports. `migrate` is an explicit tools-profile service; run it before API
   startup against a new Compose database. Compose does not deploy anything.
9. **Seed safety:** `prisma/seed.ts` creates records and logs a demo password.
   Only run it against a disposable/development database.
10. **Tests are limited:** backend/frontend TypeScript scripts are present;
    the backend test directory and frontend test script are absent. Run
    runtime/integration checks for behavior not covered by typechecking.
11. **Static routes and placeholders:** the sidebar includes `/notifications`
    but there is no corresponding App Router page. Team Settings remains a
    placeholder. Empty dashboard/API hook folders and older websocket
    scaffolding are not part of the active path.
12. **Lockfiles are generated:** use Bun to update each app's `bun.lock`
    together with its own `package.json`; do not hand-edit lock entries.

## 12. Quick change-tracing index

| Change requested | Likely files to inspect together |
|---|---|
| Add/adjust an API endpoint | `backend/src/routes/*.routes.ts`, matching controller, service, validation schema, Prisma schema/migration if data changes, frontend API function/types/hook and route component. |
| Add an incident field | Prisma schema + migration → backend service and validation → controller/API response → frontend type/schema/form/list/detail rendering → query invalidation if relevant. |
| Change roles/permissions | Backend auth/JWT claims, `role.middleware.ts`, route middleware wiring, frontend `session.ts`, `permissions.ts`/`use-can.ts`, and UI controls. Treat backend as enforcement boundary. |
| Change realtime behavior | Backend `realtime/events.ts`, `realtime/publisher.ts`, publishing service call sites and `realtime/socket.ts`; frontend `lib/realtime/event.ts`, `socket.ts`, `use-realtime-incidents.ts`, provider wiring and affected query keys. |
| Change dashboard stats | Backend `dashboard.service.ts` and controller/route → frontend dashboard API/schema/key/hook → dashboard page. |
| Change global UI tokens/providers | `app/globals.css`, `app/layout.tsx`, and `components/providers.tsx`; verify both Tailwind classes and provider ordering. |

The most useful rule when tracing behavior is to follow the existing contracts:
route path and HTTP method, controller request/response shape, service behavior,
Prisma model shape, frontend API response type/schema, query key, and
component rendering. A change at one layer can compile while leaving a
neighboring contract inconsistent.
