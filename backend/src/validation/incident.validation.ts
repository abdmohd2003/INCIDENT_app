import { z } from "zod";

export const incidentIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createIncidentBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(10_000).optional(),
  severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]).optional(),
});

export const updateIncidentBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(10_000).optional(),
  severity: z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one incident field must be provided",
});

export const incidentStatusBodySchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "MITIGATING", "RESOLVING", "RESOLVED"]),
});

export const assignIncidentBodySchema = z.object({
  userId: z.string().cuid(),
});

export const commentBodySchema = z.object({
  content: z.string().trim().min(1).max(5_000),
});

export const userIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const registerBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

const incidentStatuses = [
  "OPEN",
  "INVESTIGATING",
  "MITIGATING",
  "RESOLVING",
  "RESOLVED",
] as const;

const incidentSeverities = [
  "SEV1",
  "SEV2",
  "SEV3",
  "SEV4",
] as const;

const sortFields = [
  "createdAt",
  "updatedAt",
  "title",
  "severity",
  "status",
] as const;

export const getIncidentsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "page must be at least 1")
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1, "limit must be at least 1")
    .max(100, "limit cannot be greater than 100")
    .default(10),

  search: z
    .string()
    .trim()
    .min(1, "search cannot be empty")
    .max(100, "search cannot exceed 100 characters")
    .optional(),

  severity: z.enum(incidentSeverities).optional(),

  status: z.enum(incidentStatuses).optional(),

  assigneeId: z
    .string()
    .trim()
    .min(1, "assigneeId cannot be empty")
    .optional(),

  sortBy: z
    .enum(sortFields)
    .default("createdAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type GetIncidentsQuery = z.infer<
  typeof getIncidentsQuerySchema
>;