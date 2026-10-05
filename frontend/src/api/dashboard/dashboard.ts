import { apiClient } from "@/lib/api/client";
import { dashboardStatsSchema } from "./stats-schema";

export const dashboardStatsKey = ["dashboard", "stats"] as const;

export async function getDashboardStats() {
  const response = await apiClient<unknown>("/incidents/stats");
  return dashboardStatsSchema.parse(response);
}