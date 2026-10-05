import { z } from "zod";

const incidentSeveritySchema = z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]);
const incidentStatusSchema = z.enum([
  "OPEN",
  "INVESTIGATING",
  "MITIGATING",
  "RESOLVING",
  "RESOLVED",
]);

const userSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export const dashboardStatsSchema = z.object({
  bySeverity: z.array(z.object({ severity: incidentSeveritySchema, count: z.number().int().nonnegative() })),
  byStatus: z.array(z.object({ status: incidentStatusSchema, count: z.number().int().nonnegative() })),
  active: z.number().int().nonnegative(),
  sev1Open: z.number().int().nonnegative(),
  resolved7d: z.number().int().nonnegative(),
  mttrMinutes: z.number().nonnegative().nullable(),
  daily: z.array(z.object({ date: z.string(), count: z.number().int().nonnegative() })).length(14),
  topActive: z.array(z.object({
    id: z.string(),
    title: z.string(),
    severity: incidentSeveritySchema,
    status: incidentStatusSchema,
    createdAt: z.string(),
    assignedTo: userSummarySchema.nullable(),
  })).max(5),
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.enum(["CREATED", "STATUS_CHANGED", "ASSIGNED", "UNASSIGNED", "COMMENT_ADDED", "UPDATED", "RESOLVED"]),
    message: z.string(),
    createdAt: z.string(),
    user: userSummarySchema.nullable(),
    incident: z.object({ id: z.string(), title: z.string() }),
  })).max(8),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;