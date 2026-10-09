import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

import { env } from "../config/env.js";
import { notificationQueue } from "../queues/notification.queue.js";
import { NOTIFICATION_WORKER_HEALTH_KEY } from "../queues/notification.types.js";
import { rateLimitRedis, redisPrefix } from "../lib/redis.js";
import { prisma } from "../lib/prisma.js";
import {
  dependencyReady,
  metricsRegistry,
  queueJobs,
  websocketConnections,
} from "../lib/metrics.js";
import { getSocketHealth } from "../realtime/socket.js";
import { logger } from "../lib/logger.js";

export const live = (_req: Request, res: Response) =>
  res.status(200).json({ status: "ok" });

export const ready = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [databaseResult, redisResult, queueResult, workerResult] =
      await Promise.allSettled([
        prisma.$queryRaw`SELECT 1`,
        rateLimitRedis.ping(),
        notificationQueue.getJobCounts(
          "waiting",
          "active",
          "completed",
          "failed",
          "delayed",
        ),
        env.QUEUE_WORKER_REQUIRED
          ? rateLimitRedis.get(`${redisPrefix}:${NOTIFICATION_WORKER_HEALTH_KEY}`)
          : Promise.resolve("1"),
      ]);

    const databaseReady = databaseResult.status === "fulfilled";
    const redisReady = redisResult.status === "fulfilled" && redisResult.value === "PONG";
    const queueReady = queueResult.status === "fulfilled";
    const socketHealth = getSocketHealth();
    const workerReady =
      workerResult.status === "fulfilled" && workerResult.value === "1";

    dependencyReady.set({ dependency: "database" }, Number(databaseReady));
    dependencyReady.set({ dependency: "redis" }, Number(redisReady));
    dependencyReady.set({ dependency: "queue" }, Number(queueReady));
    dependencyReady.set({ dependency: "worker" }, Number(workerReady));
    dependencyReady.set({ dependency: "socketio" }, Number(socketHealth.initialized));
    websocketConnections.set(socketHealth.connectedClients);

    if (queueResult.status === "fulfilled") {
      for (const state of ["waiting", "active", "completed", "failed", "delayed"] as const) {
        queueJobs.set({ state }, queueResult.value[state] ?? 0);
      }
    }

    const dependencies = {
      database: databaseReady,
      redis: redisReady,
      queue: queueReady,
      worker: workerReady,
      socketio: socketHealth.initialized,
    };
    const isReady = Object.values(dependencies).every(Boolean);

    if (!isReady) {
      (req.log ?? logger).warn({ dependencies }, "Readiness check failed");
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(isReady ? 200 : 503).json({
      status: isReady ? "ready" : "not_ready",
      dependencies,
    });
  } catch (error) {
    next(error);
  }
};

export const metricsAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (env.NODE_ENV !== "production" && !env.metricsToken) {
    next();
    return;
  }

  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = env.metricsToken ?? "";
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  const matches =
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer);

  if (!matches) {
    res.status(401).json({
      success: false,
      message: "Metrics authentication required",
      error: {
        code: "UNAUTHORIZED",
        message: "Metrics authentication required",
        requestId: String(res.getHeader("X-Request-Id") ?? "unknown"),
      },
    });
    return;
  }

  next();
};

export const metrics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const socketHealth = getSocketHealth();
    websocketConnections.set(socketHealth.connectedClients);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", metricsRegistry.contentType);
    res.end(await metricsRegistry.metrics());
  } catch (error) {
    next(error);
  }
};
