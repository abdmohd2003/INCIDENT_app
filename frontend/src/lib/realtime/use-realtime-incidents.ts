"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { dashboardStatsKey } from "@/api/dashboard/dashboard";
import { incidentKeys } from "@/hooks/incidents/use-incidents";

import { getExistingSocket } from "./socket";
import {
  REALTIME_EVENTS,
  type IncidentRealtimePayload,
} from "./event";

export const useRealtimeIncidents = (token: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getExistingSocket();

    if (!socket) {
      console.error("Realtime socket was not initialized before incident listeners.");
      return;
    }

    const invalidateIncidentList = () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.lists(),
      });
    };

    const invalidateIncidentDetail = (incidentId: string) => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(incidentId),
      });
    };

    const invalidateIncidentTimeline = (incidentId: string) => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.timeline(incidentId),
      });
    };

    const invalidateDashboard = () => {
      queryClient.invalidateQueries({
        queryKey: dashboardStatsKey,
      });
    };

    const handleIncidentCreated = (
      payload: IncidentRealtimePayload,
    ) => {
      console.log(
        "Realtime event: incident.created",
        payload,
      );

      invalidateIncidentList();
      invalidateDashboard();
    };

    const handleIncidentUpdated = (
      payload: IncidentRealtimePayload,
    ) => {
      console.log(
        "Realtime event: incident.updated",
        payload,
      );

      invalidateIncidentList();
      invalidateIncidentDetail(payload.incidentId);
      invalidateIncidentTimeline(payload.incidentId);
      invalidateDashboard();
    };

    const handleIncidentStatusChanged = (
      payload: IncidentRealtimePayload,
    ) => {
      console.log(
        "Realtime event: incident.status_changed",
        payload,
      );

      invalidateIncidentList();
      invalidateIncidentDetail(payload.incidentId);
      invalidateIncidentTimeline(payload.incidentId);
      invalidateDashboard();
    };

    const handleIncidentAssigned = (
      payload: IncidentRealtimePayload,
    ) => {
      console.log(
        "Realtime event: incident.assigned",
        payload,
      );

      invalidateIncidentList();
      invalidateIncidentDetail(payload.incidentId);
      invalidateIncidentTimeline(payload.incidentId);
      invalidateDashboard();
    };

    const handleIncidentCommentAdded = (
      payload: IncidentRealtimePayload,
    ) => {
      console.log(
        "Realtime event: incident.comment_added",
        payload,
      );

      queryClient.invalidateQueries({
        queryKey: incidentKeys.comments(
          payload.incidentId,
        ),
      });

      invalidateIncidentDetail(payload.incidentId);
      invalidateIncidentTimeline(payload.incidentId);
    };

    const handleIncidentResolved = (
      payload: IncidentRealtimePayload,
    ) => {
      console.log(
        "Realtime event: incident.resolved",
        payload,
      );

      invalidateIncidentList();
      invalidateIncidentDetail(payload.incidentId);
      invalidateIncidentTimeline(payload.incidentId);
      invalidateDashboard();
    };

    socket.on(
      REALTIME_EVENTS.INCIDENT_CREATED,
      handleIncidentCreated,
    );

    socket.on(
      REALTIME_EVENTS.INCIDENT_UPDATED,
      handleIncidentUpdated,
    );

    socket.on(
      REALTIME_EVENTS.INCIDENT_STATUS_CHANGED,
      handleIncidentStatusChanged,
    );

    socket.on(
      REALTIME_EVENTS.INCIDENT_ASSIGNED,
      handleIncidentAssigned,
    );

    socket.on(
      REALTIME_EVENTS.INCIDENT_COMMENT_ADDED,
      handleIncidentCommentAdded,
    );

    socket.on(
      REALTIME_EVENTS.INCIDENT_RESOLVED,
      handleIncidentResolved,
    );

    return () => {
      socket.off(
        REALTIME_EVENTS.INCIDENT_CREATED,
        handleIncidentCreated,
      );

      socket.off(
        REALTIME_EVENTS.INCIDENT_UPDATED,
        handleIncidentUpdated,
      );

      socket.off(
        REALTIME_EVENTS.INCIDENT_STATUS_CHANGED,
        handleIncidentStatusChanged,
      );

      socket.off(
        REALTIME_EVENTS.INCIDENT_ASSIGNED,
        handleIncidentAssigned,
      );

      socket.off(
        REALTIME_EVENTS.INCIDENT_COMMENT_ADDED,
        handleIncidentCommentAdded,
      );

      socket.off(
        REALTIME_EVENTS.INCIDENT_RESOLVED,
        handleIncidentResolved,
      );
    };
  }, [token, queryClient]);
};