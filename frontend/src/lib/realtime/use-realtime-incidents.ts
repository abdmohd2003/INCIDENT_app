"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { dashboardStatsKey } from "@/api/dashboard/dashboard";
import { incidentKeys } from "@/hooks/incidents/use-incidents";

import { connectSocket, disconnectSocket, getSocket } from "./socket";
import {
  isIncidentRealtimePayload,
  REALTIME_EVENTS,
  type IncidentRealtimePayload,
} from "./event";

export const useRealtimeIncidents = (token: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token || process.env.NEXT_PUBLIC_REALTIME_ENABLED === "false") {
      disconnectSocket();
      return;
    }

    const socket = getSocket(token);
    let hasConnected = false;

    const invalidateIncidentList = () => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    };

    const invalidateIncident = (incidentId: string) => {
      void queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(incidentId),
      });
      void queryClient.invalidateQueries({
        queryKey: incidentKeys.timeline(incidentId),
      });
    };

    const invalidateDashboard = () => {
      void queryClient.invalidateQueries({ queryKey: dashboardStatsKey });
    };

    const handleEvent = (
      eventName: string,
      payload: IncidentRealtimePayload,
    ) => {
      console.info(`Realtime event: ${eventName}`, payload);
      invalidateIncidentList();
      invalidateIncident(payload.incidentId);
      invalidateDashboard();

      if (eventName === REALTIME_EVENTS.INCIDENT_COMMENT_ADDED) {
        void queryClient.invalidateQueries({
          queryKey: incidentKeys.comments(payload.incidentId),
        });
      }
    };

    const handlers = new Map<
      string,
      (payload: unknown) => void
    >();

    const eventNames = Object.values(REALTIME_EVENTS);
    for (const eventName of eventNames) {
      handlers.set(eventName, (payload: unknown) => {
        if (!isIncidentRealtimePayload(payload)) {
          console.error(`Invalid realtime payload for ${eventName}`, payload);
          return;
        }
        handleEvent(eventName, payload);
      });
    }

    const handleConnect = () => {
      console.info("Realtime connected");
      if (hasConnected) {
        void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
        invalidateDashboard();
      }
      hasConnected = true;
    };
    const handleConnectError = (error: Error) => {
      console.error("Realtime connection error:", error.message);
    };

    for (const [eventName, handler] of handlers) {
      socket.on(eventName, handler);
    }
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    connectSocket(token);

    return () => {
      for (const [eventName, handler] of handlers) {
        socket.off(eventName, handler);
      }
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [token, queryClient]);
};
