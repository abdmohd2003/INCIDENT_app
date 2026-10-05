import { z } from "zod";

export const incidentFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string(),
  severity: z.union([
    z.enum(["SEV1", "SEV2", "SEV3", "SEV4"]),
    z.literal(""),
  ]),
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;