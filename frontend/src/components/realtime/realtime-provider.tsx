"use client";

import { ReactNode, useEffect } from "react";

import {
  connectSocket,
  disconnectSocket,
} from "@/lib/realtime/socket";
import { useRealtimeIncidents } from "@/lib/realtime/use-realtime-incidents";

interface RealtimeProviderProps {
  children: ReactNode;
  token: string | null;
}

export function RealtimeProvider({
  children,
  token,
}: RealtimeProviderProps) {
  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return;
    }

    const currentSocket = connectSocket(token);

    const handleConnect = () => {
      console.log("Realtime connected:", currentSocket.id);
    };

    const handleDisconnect = (reason: string) => {
      console.log("Realtime disconnected:", reason);
    };

    const handleConnectError = (error: Error) => {
      console.error("Realtime connection error:", error.message);
    };

    currentSocket.on("connect", handleConnect);
    currentSocket.on("disconnect", handleDisconnect);
    currentSocket.on("connect_error", handleConnectError);

    return () => {
      currentSocket.off("connect", handleConnect);
      currentSocket.off("disconnect", handleDisconnect);
      currentSocket.off("connect_error", handleConnectError);
    };
  }, [token]);

  useRealtimeIncidents(token);

  return children;
}