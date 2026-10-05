import { z } from "zod";

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