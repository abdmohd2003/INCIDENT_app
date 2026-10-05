import { prisma } from "../lib/prisma.js";

const severities = ["SEV1", "SEV2", "SEV3", "SEV4"] as const;
const statuses = [
  "OPEN",
  "INVESTIGATING",
  "MITIGATING",
  "RESOLVING",
  "RESOLVED",
] as const;

export const getDashboardStats = async () => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dailyStart = new Date(today);
  dailyStart.setUTCDate(dailyStart.getUTCDate() - 13);
  const resolvedStart = new Date(now);
  resolvedStart.setUTCDate(resolvedStart.getUTCDate() - 7);

  const [
    severityGroups,
    statusGroups,
    active,
    sev1Open,
    resolved7d,
    resolvedIncidents,
    dailyIncidents,
    topActive,
    recentActivity,
  ] = await Promise.all([
    prisma.incident.groupBy({ by: ["severity"], _count: { _all: true } }),
    prisma.incident.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.incident.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.incident.count({ where: { status: "OPEN", severity: "SEV1" } }),
    prisma.incident.count({
      where: { status: "RESOLVED", resolvedAt: { gte: resolvedStart } },
    }),
    prisma.incident.findMany({
      where: { status: "RESOLVED", resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.incident.findMany({
      where: { createdAt: { gte: dailyStart } },
      select: { createdAt: true },
    }),
    prisma.incident.findMany({
      where: { status: { not: "RESOLVED" } },
      orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
      take: 5,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.incidentEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { id: true, name: true, email: true } },
        incident: { select: { id: true, title: true } },
      },
    }),
  ]);

  const severityCounts = new Map(
    severityGroups.map((group) => [group.severity, group._count._all]),
  );
  const statusCounts = new Map(
    statusGroups.map((group) => [group.status, group._count._all]),
  );
  const dailyCounts = new Map<string, number>();

  for (let index = 0; index < 14; index += 1) {
    const day = new Date(dailyStart);
    day.setUTCDate(dailyStart.getUTCDate() + index);
    dailyCounts.set(day.toISOString().slice(0, 10), 0);
  }

  for (const incident of dailyIncidents) {
    const date = incident.createdAt.toISOString().slice(0, 10);
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
  }

  const durations = resolvedIncidents.flatMap((incident) => {
  if (!incident.resolvedAt) {
    return [];
  }

  const duration =
    (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60_000;

  return duration >= 0 ? [duration] : [];
});

  return {
    bySeverity: severities.map((severity) => ({
      severity,
      count: severityCounts.get(severity) ?? 0,
    })),
    byStatus: statuses.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })),
    active,
    sev1Open,
    resolved7d,
    mttrMinutes: durations.length
      ? durations.reduce((total, duration) => total + duration, 0) / durations.length
      : null,
    daily: [...dailyCounts].map(([date, count]) => ({ date, count })),
    topActive,
    recentActivity,
  };
};