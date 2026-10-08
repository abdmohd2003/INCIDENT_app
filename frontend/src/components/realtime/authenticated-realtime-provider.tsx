"use client";

import { ReactNode } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import { RealtimeProvider } from "./realtime-provider";

interface AuthenticatedRealtimeProviderProps {
  children: ReactNode;
}

export function AuthenticatedRealtimeProvider({
  children,
}: AuthenticatedRealtimeProviderProps) {
  const { token } = useAuth();

  return (
    <RealtimeProvider token={token}>
      {children}
    </RealtimeProvider>
  );
}