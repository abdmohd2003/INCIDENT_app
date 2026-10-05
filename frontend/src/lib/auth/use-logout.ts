"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";

export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useCallback(() => {
    logout();
    queryClient.clear();
    router.replace("/login");
  }, [logout, queryClient, router]);
}