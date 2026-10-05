"use client";

import type { ReactNode } from "react";

import { useCan } from "@/lib/auth/use-can";
import type { AuthRole } from "@/lib/auth/session";

type CanProps = {
  roles: AuthRole | AuthRole[];
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ roles, children, fallback = null }: CanProps) {
  const { can } = useCan();

  if (!can(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}