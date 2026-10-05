import { prisma } from "../lib/prisma.js";

type NotificationType =
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_STATUS_CHANGED"
  | "INCIDENT_COMMENT_ADDED"
  | "INCIDENT_UPDATED";

type DbClient = Pick<typeof prisma, "notification">;

export const createNotification = async (
  data: {
    type: NotificationType;
    message: string;
    userId: string;
    incidentId?: string;
  },
  db: DbClient = prisma
) => {
  return db.notification.create({
    data: {
      type: data.type,
      message: data.message,
      userId: data.userId,
      incidentId: data.incidentId,
    },
  });
};