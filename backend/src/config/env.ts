import "dotenv/config";

import { z } from "zod";

const optionalEnvironmentString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  REDIS_PREFIX: z.string().trim().min(1).default("incident"),
  CORS_ORIGINS: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  METRICS_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().trim().min(1).optional(),
  RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
  LOGIN_RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_DURATION: z.coerce.number().int().positive().default(60),
  LOGIN_RATE_LIMIT_BLOCK_DURATION: z.coerce.number().int().positive().default(900),
  QUEUE_JOB_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(3),
  QUEUE_BACKOFF_MS: z.coerce.number().int().min(100).default(2000),
  QUEUE_WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100).default(5),
  QUEUE_WORKER_REQUIRED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  NOTIFICATION_EMAIL_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  SMTP_HOST: optionalEnvironmentString,
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  SMTP_USER: optionalEnvironmentString,
  SMTP_PASS: optionalEnvironmentString,
  SMTP_FROM: optionalEnvironmentString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

if (parsed.data.NODE_ENV === "production") {
  if (parsed.data.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production");
  }
  if (!parsed.data.CORS_ORIGINS?.trim()) {
    throw new Error("CORS_ORIGINS must be configured in production");
  }
  if (!parsed.data.METRICS_TOKEN || parsed.data.METRICS_TOKEN.length < 24) {
    throw new Error("METRICS_TOKEN must contain at least 24 characters in production");
  }
}

if (parsed.data.NOTIFICATION_EMAIL_ENABLED) {
  if (!parsed.data.SMTP_HOST || !parsed.data.SMTP_USER || !parsed.data.SMTP_PASS) {
    throw new Error(
      `SMTP_HOST, SMTP_USER, and SMTP_PASS are required when email delivery is enabled`,
    );
  }
}

const originSetting =
  parsed.data.CORS_ORIGINS ??
  parsed.data.FRONTEND_URL ??
  "http://localhost:3001";

export const env = {
  ...parsed.data,
  corsOrigins: originSetting
    .split(",")
    .map((origin) => new URL(origin.trim()).origin)
    .filter(Boolean),
  metricsToken: parsed.data.METRICS_TOKEN,
};

export const isAllowedOrigin = (origin: string | undefined) =>
  !origin || env.corsOrigins.includes(origin);
