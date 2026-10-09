"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { useRealtimeIncidents } from "@/lib/realtime/use-realtime-incidents";

export function AuthenticatedRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token } = useAuth();
  useRealtimeIncidents(token);
  return children;
}
