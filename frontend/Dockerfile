FROM oven/bun:1 AS dependencies

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS build

ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ARG NEXT_PUBLIC_REALTIME_ENABLED=true
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_REALTIME_ENABLED=${NEXT_PUBLIC_REALTIME_ENABLED}

COPY . .
RUN bun run build

FROM oven/bun:1 AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/public ./public

USER bun
EXPOSE 3001
CMD ["bun", "run", "start", "--", "-p", "3001"]
