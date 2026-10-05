"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  addIncidentComment,
  assignIncident,
  createIncident,
  getIncident,
  getIncidentComments,
  getIncidentEvents,
  getIncidents,
  getUsers,
  updateIncident,
  updateIncidentStatus,
} from "@/api/incidents/incidents";
import { dashboardStatsKey } from "@/api/dashboard/dashboard";

import type {
  CreateIncidentInput,
  IncidentListParams,
  UpdateIncidentInput,
  UpdateIncidentStatusInput,
} from "@/api/incidents/types";

export const incidentKeys = {
  all: ["incidents"] as const,
  lists: () => [...incidentKeys.all, "list"] as const,
  list: (params: IncidentListParams) =>
    [...incidentKeys.lists(), params] as const,
  details: () => [...incidentKeys.all, "detail"] as const,
  detail: (id: string) => [...incidentKeys.details(), id] as const,
  comments: (id: string) =>
    [...incidentKeys.detail(id), "comments"] as const,
  timeline: (id: string) =>
    [...incidentKeys.detail(id), "timeline"] as const,
};

export function useIncidents(params: IncidentListParams) {
  return useQuery({
    queryKey: incidentKeys.list(params),
    queryFn: () => getIncidents(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id),
    queryFn: () => getIncident(id),
    enabled: Boolean(id),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
}

export function useIncidentComments(id: string) {
  return useQuery({
    queryKey: incidentKeys.comments(id),
    queryFn: () => getIncidentComments(id),
    enabled: Boolean(id),
  });
}

export function useIncidentTimeline(id: string) {
  return useQuery({
    queryKey: incidentKeys.timeline(id),
    queryFn: () => getIncidentEvents(id),
    enabled: Boolean(id),
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIncidentInput) =>
      createIncident(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.lists(),
      });
      queryClient.invalidateQueries({ queryKey: dashboardStatsKey });
    },
  });
}

export function useUpdateIncident(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateIncidentInput) =>
      updateIncident(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(id),
      });

      queryClient.invalidateQueries({ queryKey: dashboardStatsKey });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.timeline(id),
      });
    },
  });
}

export function useUpdateIncidentStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateIncidentStatusInput) =>
      updateIncidentStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(id),
      });

      queryClient.invalidateQueries({ queryKey: dashboardStatsKey });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.timeline(id),
      });
    },
  });
}

export function useAssignIncident(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      assignIncident(id, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(id),
      });

      queryClient.invalidateQueries({ queryKey: dashboardStatsKey });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.timeline(id),
      });
    },
  });
}

export function useAddIncidentComment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      addIncidentComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: incidentKeys.comments(id),
      });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.detail(id),
      });

      queryClient.invalidateQueries({ queryKey: dashboardStatsKey });

      queryClient.invalidateQueries({
        queryKey: incidentKeys.timeline(id),
      });
    },
  });
}