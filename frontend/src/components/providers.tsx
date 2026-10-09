"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/auth/auth-context";
import { AuthenticatedRealtimeProvider } from "@/components/realtime/authenticated-realtime-provider";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
      >
        <AuthProvider>
          <AuthenticatedRealtimeProvider>
            {children}
          </AuthenticatedRealtimeProvider>

          <Toaster
            position="bottom-right"
            closeButton
            richColors
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}