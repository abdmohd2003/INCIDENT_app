import { Worker, type Job } from "bullmq";

import { env } from "../config/env.js";
import {
  NOTIFICATION_QUEUE_NAME,
  NOTIFICATION_WORKER_HEALTH_KEY,
  type NotificationEmailJobData,
} from "../queues/notification.types.js";
import { rateLimitRedis, getRedisUrl, redisPrefix } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import {
  sendEmail,
  verifyEmailTransport,
} from "../services/email.service.js";

const concurrency = env.QUEUE_WORKER_CONCURRENCY;
const workerHealthKey = `${redisPrefix}:${NOTIFICATION_WORKER_HEALTH_KEY}`;

const worker = new Worker<NotificationEmailJobData>(
  NOTIFICATION_QUEUE_NAME,
  async (job: Job<NotificationEmailJobData>) => {
    logger.info(
      { jobId: job.id, jobName: job.name, attempt: job.attemptsMade + 1 },
      "Processing notification job",
    );

    const {
      recipientEmail,
      recipientName,
      subject,
      text,
      html,
    } = job.data;

    const result = await sendEmail({
      to: recipientName ? `${recipientName} <${recipientEmail}>` : recipientEmail,
      subject,
      text,
      html,
    });

    logger.info({ jobId: job.id }, "Notification job processed");

    return result;
  },
  {
    connection: {
      url: getRedisUrl(),
      maxRetriesPerRequest: null,
    },
    prefix: redisPrefix,
    concurrency,
    removeOnComplete: {
      age: 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 60 * 60,
      count: 5000,
    },
  },
);

worker.on("ready", () => {
  logger.info({ concurrency }, "Notification worker ready");
  startHeartbeat();
});

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Notification job completed");
});

worker.on("failed", (job, error) => {
  logger.error(
    { err: error, jobId: job?.id, attemptsMade: job?.attemptsMade },
    "Notification job failed",
  );
});

worker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "Notification job stalled");
});

worker.on("error", (error) => {
  logger.error({ err: error }, "Notification worker error");
});

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Notification worker shutting down");
  if (heartbeat) clearInterval(heartbeat);
  await worker.close();
  try {
    await rateLimitRedis.del(workerHealthKey);
  } catch (error) {
    logger.error({ err: error }, "Could not clear worker heartbeat");
  }
  await rateLimitRedis.quit();
  logger.info("Notification worker shutdown complete");
  process.exit(0);
};

let heartbeat: ReturnType<typeof setInterval> | undefined;

function startHeartbeat() {
  if (heartbeat) return;
  const refresh = () =>
    void rateLimitRedis
      .set(workerHealthKey, "1", "EX", 30)
      .catch((error: unknown) =>
        logger.error({ err: error }, "Could not refresh worker heartbeat"),
      );
  refresh();
  heartbeat = setInterval(refresh, 10_000);
  heartbeat.unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await verifyEmailTransport();
} catch (error) {
  logger.fatal({ err: error }, "SMTP verification failed");
  process.exit(1);
}