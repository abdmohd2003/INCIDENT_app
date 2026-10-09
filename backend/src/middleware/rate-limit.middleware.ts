import type { NextFunction, Request, Response } from "express";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";

import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { redisPrefix, rateLimitRedis } from "../lib/redis.js";

const apiLimiter = new RateLimiterRedis({
  storeClient: rateLimitRedis,
  keyPrefix: `${redisPrefix}:api`,
  points: env.RATE_LIMIT_POINTS,
  duration: env.RATE_LIMIT_DURATION,
});

const loginLimiter = new RateLimiterRedis({
  storeClient: rateLimitRedis,
  keyPrefix: `${redisPrefix}:login`,
  points: env.LOGIN_RATE_LIMIT_POINTS,
  duration: env.LOGIN_RATE_LIMIT_DURATION,
  blockDuration: env.LOGIN_RATE_LIMIT_BLOCK_DURATION,
});

const enforceLimit = (limiter: RateLimiterRedis) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";

    try {
      const result = await limiter.consume(key);
      res.setHeader("RateLimit-Remaining", String(result.remainingPoints));
      next();
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({
          success: false,
          message: "Too many requests",
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
            requestId: String(res.getHeader("X-Request-Id") ?? "unknown"),
          },
        });
        return;
      }

      next(
        new HttpError(
          503,
          "RATE_LIMITER_UNAVAILABLE",
          "Request protection is temporarily unavailable",
        ),
      );
    }
  };

export const apiRateLimit = enforceLimit(apiLimiter);
export const loginRateLimit = enforceLimit(loginLimiter);