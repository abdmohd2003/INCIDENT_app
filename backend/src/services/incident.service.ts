import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { createNotification } from "./notification.service.js";


type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "MITIGATING"
  | "RESOLVING"
  | "RESOLVED";

type IncidentSeverity =
  | "SEV1"
  | "SEV2"
  | "SEV3"
  | "SEV4";

type NotificationType =
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_STATUS_CHANGED"
  | "INCIDENT_COMMENT_ADDED"
  | "INCIDENT_UPDATED";  

const allowedTransitions: Record<
  IncidentStatus,
  readonly IncidentStatus[]
> = {
  OPEN: ["INVESTIGATING"],
  INVESTIGATING: ["MITIGATING"],
  MITIGATING: ["RESOLVING"],
  RESOLVING: ["RESOLVED"],
  RESOLVED: [],
};


// CREATE INCIDENT
export const createIncident = async (
  userId: string,
  data: {
    title: string;
    description?: string;
    severity?: IncidentSeverity;
  }
) => {
  return prisma.$transaction(async (tx) => {
    const incident = await tx.incident.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity,
        createdBy: { connect: { id: userId } },
      },
    });

    await tx.incidentEvent.create({
      data: {
        type: "CREATED",
        message: "Incident created",
        incidentId: incident.id,
        userId,
      },
    });

    return incident;
  });
};


// GET ALL INCIDENTS
// export const getIncidents = async () => {
//   return prisma.incident.findMany({
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
// };


// export const getIncidents = async ({
//   page,
//   limit,
//   search,
//   severity,
//   status,
//   assigneeId,
//   sortBy,
//   sortOrder,
// }: {
//   page: number;
//   limit: number;
//   search?: string;
//   severity?: "SEV1" | "SEV2" | "SEV3" | "SEV4";
//   status?:
//     | "OPEN"
//     | "INVESTIGATING"
//     | "MITIGATING"
//     | "RESOLVING"
//     | "RESOLVED";
//   assigneeId?: string;
//   sortBy:
//     | "createdAt"
//     | "updatedAt"
//     | "title"
//     | "severity"
//     | "status";
//   sortOrder: "asc" | "desc";
// }) => {
//   const skip = (page - 1) * limit;

//   const where: Prisma.IncidentWhereInput = {};

//   if (search) {
//     where.OR = [
//       {
//         title: {
//           contains: search,
//           mode: "insensitive",
//         },
//       },
//       {
//         description: {
//           contains: search,
//           mode: "insensitive",
//         },
//       },
//     ];
//   }

//   if (severity) {
//     where.severity = severity;
//   }

//   if (status) {
//     where.status = status;
//   }

//   if (assigneeId) {
//     where.assignedToId = assigneeId;
//   }

//   const [incidents, total] = await prisma.$transaction([
//     prisma.incident.findMany({
//       where,
//       skip,
//       take: limit,

//       orderBy: {
//         [sortBy]: sortOrder,
//       },

//       include: {
//         assignedTo: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             role: true,
//           },
//         },
//       },
//     }),

//     prisma.incident.count({
//       where,
//     }),
//   ]);

//   return {
//     incidents,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//     },
//   };
// };

export const getIncidents = async ({
  page = 1,
  limit = 10,
  search,
  severity,
  status,
  assigneeId,
  sortBy = "createdAt",
  sortOrder = "desc",
}: {
  page?: number;
  limit?: number;
  search?: string;
  severity?: "SEV1" | "SEV2" | "SEV3" | "SEV4";
  status?:
    | "OPEN"
    | "INVESTIGATING"
    | "MITIGATING"
    | "RESOLVING"
    | "RESOLVED";
  assigneeId?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "title"
    | "severity"
    | "status";
  sortOrder?: "asc" | "desc";
}) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const skip = (safePage - 1) * safeLimit;

  const where: Prisma.IncidentWhereInput = {};

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (severity) {
    where.severity = severity;
  }

  if (status) {
    where.status = status;
  }

  if (assigneeId) {
    where.assignedToId = assigneeId;
  }

  const [incidents, total] = await prisma.$transaction([
    prisma.incident.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),

    prisma.incident.count({
      where,
    }),
  ]);

  return {
    incidents,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

// GET INCIDENT BY ID
export const getIncidentById = async (id: string) => {
  return prisma.incident.findUnique({
    where: {
      id,
    },
  });
};


// UPDATE INCIDENT
export const updateIncident = async (
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    severity?: IncidentSeverity;
  }
) => {
  return prisma.$transaction(async (tx) => {
    const incident = await tx.incident.update({
      where: { id },
      data,
    });

    await tx.incidentEvent.create({
      data: {
        type: "UPDATED",
        message: "Incident details updated",
        incidentId: id,
        userId,
      },
    });

    return incident;
  });
};


// CHANGE INCIDENT STATUS
export const transitionIncidentStatus = async (
  incidentId: string,
  newStatus: IncidentStatus,
  userId: string
) => {
  const incident = await prisma.incident.findUnique({
    where: {
      id: incidentId,
    },
  });

  if (!incident) {
    throw new Error("INCIDENT_NOT_FOUND");
  }

  if (incident.status === newStatus) {
    throw new Error("STATUS_ALREADY_SET");
  }

  const allowed = allowedTransitions[incident.status];

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${incident.status} to ${newStatus}`
    );
  }

  const resolvedAt =
    newStatus === "RESOLVED"
      ? new Date()
      : null;

  return prisma.$transaction(async (tx) => {
    const updatedIncident = await tx.incident.update({
      where: {
        id: incidentId,
      },
      data: {
        status: newStatus,
        resolvedAt,
      },
    });

    await tx.incidentEvent.create({
      data: {
        type:
          newStatus === "RESOLVED"
            ? "RESOLVED"
            : "STATUS_CHANGED",

        message: `Status changed from ${incident.status} to ${newStatus}`,

        incidentId,

        userId,
      },
    });

    return updatedIncident;
  });
};


// ASSIGN INCIDENT
export const assignIncident = async (
  incidentId: string,
  userId: string,
  assignedBy: string
) => {
  const incident = await prisma.incident.findUnique({
    where: {
      id: incidentId,
    },
  });

  if (!incident) {
    throw new Error("INCIDENT_NOT_FOUND");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const updatedIncident = await tx.incident.update({
      where: {
        id: incidentId,
      },

      data: {
        assignedTo: {
          connect: {
            id: userId,
          },
        },
      },

      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await tx.incidentEvent.create({
      data: {
        type: "ASSIGNED",
        message: `Incident assigned to ${user.name}`,
        incidentId,
        userId: assignedBy,
      },
    });
    await createNotification(
      {
      type: "INCIDENT_ASSIGNED",
      message: `Incident assigned to ${user.name}`,
      userId,
      incidentId,
    },
    tx
  );

    return updatedIncident;
  });
};

