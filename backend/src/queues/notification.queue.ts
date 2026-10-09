import { Queue } from "bullmq";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { getRedisUrl, redisPrefix } from "../lib/redis.js";
import {
  NOTIFICATION_QUEUE_NAME,
  type NotificationEmailJobData,
} from "./notification.types.js";

export { NOTIFICATION_QUEUE_NAME } from "./notification.types.js";
export type { NotificationEmailJobData } from "./notification.types.js";

export const notificationQueue = new Queue<NotificationEmailJobData>(
  NOTIFICATION_QUEUE_NAME,
  {
    connection: {
      url: getRedisUrl(),
      maxRetriesPerRequest: 20,
      enableOfflineQueue: false,
    },
    prefix: redisPrefix,
    defaultJobOptions: {
      attempts: env.QUEUE_JOB_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: env.QUEUE_BACKOFF_MS,
      },
      removeOnComplete: {
        age: 60 * 60,
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 60 * 60,
        count: 5000,
      },
    },
  },
);

notificationQueue.on("error", (error) => {
  logger.error({ err: error }, "Notification queue error");
});

export const enqueueNotificationEmail = async (
  data: NotificationEmailJobData,
) => {
  return notificationQueue.add("send-notification-email", data, {
    jobId: `notification-${data.notificationId}`,
  });
};