"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { RealtimeProvider } from "./realtime-provider";

export function AuthenticatedRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token } = useAuth();

  return (
    <RealtimeProvider token={token}>
      {children}
    </RealtimeProvider>
  );
}
