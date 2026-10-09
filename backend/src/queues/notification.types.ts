export const NOTIFICATION_QUEUE_NAME = "notifications";
export const NOTIFICATION_WORKER_HEALTH_KEY = "health:notification-worker";

export type NotificationEmailJobData = {
  notificationId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  text: string;
  html?: string;
};
