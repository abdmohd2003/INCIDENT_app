"use client";

import { useQuery } from "@tanstack/react-query";
import {
  dashboardStatsKey,
  getDashboardStats,
} from "@/api/dashboard/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardStatsKey,
    queryFn: getDashboardStats,
  });
}