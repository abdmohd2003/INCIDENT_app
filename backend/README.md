# Incident Management API

The active server is `src/server.ts`; `index.ts` is only a Bun placeholder.

## Run with local PostgreSQL and Redis

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and a local
   `JWT_SECRET`. Never use example values outside local development.
3. Apply migrations with `bunx prisma migrate deploy` (or `bunx prisma migrate
   dev` for schema development).
4. Start the API with `bun run dev`.
5. Start the optional notification worker in another terminal with
   `bun run dev:worker`.

## Run the local Compose stack

From the repository root, copy `.env.example` to `.env`, then run:

```bash
docker compose --profile tools run --rm migrate
docker compose up --build -d
docker compose ps
```

PostgreSQL and Redis are bound to loopback on ports 5433 and 6380 by default.
The API uses port 3000; set `API_PORT` if that host port is occupied. Compose
is for local preparation only; it does not deploy the application.
