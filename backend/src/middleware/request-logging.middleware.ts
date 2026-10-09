import { randomUUID } from "node:crypto";
import { pinoHttp } from "pino-http";

import { env } from "../config/env.js";

export const requestLogger = pinoHttp({
  level: env.LOG_LEVEL,
  base: {
    service: "incident-api",
    environment: env.NODE_ENV,
  },
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "headers.authorization", "headers.cookie"],
    censor: "[REDACTED]",
  },
  genReqId: (_req, res) => {
    const requestId = randomUUID();
    res.setHeader("X-Request-Id", requestId);
    return requestId;
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url?.split("?")[0],
      remoteAddress: req.socket.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  wrapSerializers: false,
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/health/live" || req.url === "/health/ready",
  },
});
