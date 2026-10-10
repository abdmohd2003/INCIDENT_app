"use client";

import type { ReactNode } from "react";

import { useRealtimeIncidents } from "@/lib/realtime/use-realtime-incidents";

interface RealtimeProviderProps {
  children: ReactNode;
  token: string | null;
}

export function RealtimeProvider({
  children,
  token,
}: RealtimeProviderProps) {
  useRealtimeIncidents(token);

  return children;
}