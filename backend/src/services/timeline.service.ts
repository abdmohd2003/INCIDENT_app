import { prisma } from "../lib/prisma.js";

export const getIncidentEvents = async (incidentId: string) => {
  return prisma.incidentEvent.findMany({
    where: { incidentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};