import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

const redisUrl = env.REDIS_URL;
export const redisPrefix = env.REDIS_PREFIX;

const retryStrategy = (times: number) =>
  Math.min(Math.max(times * 500, 500), 10_000);

/**
 * Redis client used by rate limiting.
 *
 * Rate limiting should fail quickly if Redis is unavailable rather than
 * allowing Redis commands to sit in an offline queue.
 */
export const rateLimitRedis = new Redis(redisUrl, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy,
});

rateLimitRedis.on("error", (error) => {
  logger.error({ err: error }, "Redis rate-limit client error");
});

rateLimitRedis.on("connect", () => {
  logger.info("Redis rate-limit client connected");
});

rateLimitRedis.on("ready", () => {
  logger.info("Redis rate-limit client ready");
});

rateLimitRedis.on("close", () => {
  logger.warn("Redis rate-limit client connection closed");
});

export const getRedisUrl = () => redisUrl;