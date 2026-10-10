# Incident Management Platform

The repository contains a Next.js frontend and a Bun/Express API. The API uses
PostgreSQL through Prisma, Socket.IO for realtime updates, and Redis/BullMQ for
notification jobs.

## Run the complete stack with Docker Compose

### Prerequisites

- Docker Desktop (or Docker Engine) with the Compose plugin
- Ports `3000`, `3001`, `5433`, and `6380` available on localhost

From the repository root:

```sh
cp .env.example .env
```

Review `.env` before starting. The sample values are development placeholders:
replace `JWT_SECRET` with a random value at least 32 characters long and
`METRICS_TOKEN` with a random value at least 24 characters long. Keep the
PostgreSQL password URL-safe (letters, numbers, and hyphens) because Compose
uses it in Prisma's `DATABASE_URL`. Do not use these sample values in a
production deployment.

Start the application:

```sh
docker compose up --build
```

Compose starts PostgreSQL and Redis, waits for their health checks, runs
`prisma migrate deploy`, waits for the notification worker to report healthy,
then starts the API and frontend. `migrate deploy` applies pending migrations
without resetting or deleting existing database contents. PostgreSQL and Redis
data are stored in named volumes and survive container restarts.

Open:

- Frontend: <http://localhost:3001>
- API liveness: <http://localhost:3000/health/live>
- API readiness (database, Redis, queue, worker, and Socket.IO): <http://localhost:3000/health/ready>

The browser uses `NEXT_PUBLIC_API_URL` (default `http://localhost:3000/api/v1`)
for HTTP and Socket.IO. That value is baked into the frontend image at build
time. Next.js server-side API calls use `API_INTERNAL_URL`, set inside Compose
to `http://api:3000/api/v1`. If changing the browser API URL, update
`NEXT_PUBLIC_API_URL` and `CORS_ORIGINS` in `.env`, then rebuild the frontend.

### Operations

Build and start detached:

```sh
docker compose up --build -d
```

Show service state and health:

```sh
docker compose ps
```

Follow all logs or a single service:

```sh
docker compose logs -f
docker compose logs -f migrate api worker frontend
```

Apply migrations explicitly (the normal `up` already runs this step):

```sh
docker compose run --rm migrate
```

Stop containers while preserving database and Redis data:

```sh
docker compose down
```

Do not add `--volumes`/`-v` to `docker compose down` unless you intentionally
want to delete the persisted database and Redis data.

### Troubleshooting

- Inspect startup order and service health with `docker compose ps`.
- Check the first failing service with `docker compose logs --tail=200 migrate`
  (or substitute `postgres`, `redis`, `worker`, `api`, or `frontend`).
- If migration fails, resolve the reported connection or migration issue; do
  not reset the database. Re-run `docker compose run --rm migrate`, then
  `docker compose up -d`.
- If API readiness is unhealthy, inspect API and worker logs. The API readiness
  check requires PostgreSQL, Redis, the BullMQ queue, Socket.IO initialization,
  and a recent worker heartbeat.
- If the frontend loads but API requests fail, verify `API_PORT`,
  `FRONTEND_PORT`, `NEXT_PUBLIC_API_URL`, and `CORS_ORIGINS` in `.env`, then
  rebuild with `docker compose up --build`.
- If ports conflict, change their host-port values in `.env`; container ports
  remain unchanged.
- If startup reports missing required secrets, ensure `.env` exists and has
  non-placeholder values of the required minimum lengths.

## Run without Docker

See [backend/README.md](./backend/README.md) for local API, PostgreSQL, Redis,
and worker setup. The frontend package's existing scripts are in
[frontend/package.json](./frontend/package.json).
