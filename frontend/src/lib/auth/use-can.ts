"use client";

import { useCallback } from "react";

import { useAuth } from "@/lib/auth/auth-context";
import type { AuthRole } from "@/lib/auth/session";

export function useCan() {
  const { user } = useAuth();

  const can = useCallback(
    (roles: AuthRole | AuthRole[]) => {
      if (!user) {
        return false;
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      return allowedRoles.includes(user.role);
    },
    [user],
  );

  return {
    can,
    isAdmin: user?.role === "ADMIN",
    isResponder: user?.role === "RESPONDER",
    isViewer: user?.role === "VIEWER",
  };
}