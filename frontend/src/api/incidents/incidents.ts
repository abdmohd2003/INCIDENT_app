// src/api/incidents/incidents.ts

import { apiClient } from "@/lib/api/client";

import type {
  AssignIncidentInput,
  CreateIncidentInput,
  Incident,
  IncidentCommentsResponse,
  IncidentListParams,
  IncidentPagination,
  IncidentResponse,
  IncidentTimelineResponse,
  IncidentsResponse,
  UpdateIncidentInput,
  UpdateIncidentStatusInput,
  UsersResponse,
} from "./types";

const buildQueryString = (params: IncidentListParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.severity) searchParams.set("severity", params.severity);
  if (params.status) searchParams.set("status", params.status);
  if (params.assigneeId) {
    searchParams.set("assigneeId", params.assigneeId);
  }
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();

  return query ? `?${query}` : "";
};

export async function getIncidents(
  params: IncidentListParams = {},
): Promise<IncidentsResponse> {
  return apiClient<IncidentsResponse>(
    `/incidents${buildQueryString(params)}`,
  );
}

export async function getIncident(id: string): Promise<IncidentResponse> {
  return apiClient<IncidentResponse>(`/incidents/${id}`);
}

export async function createIncident(
  input: CreateIncidentInput,
): Promise<Incident> {
  return apiClient<Incident>("/incidents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateIncident(
  id: string,
  input: UpdateIncidentInput,
): Promise<Incident> {
  return apiClient<Incident>(`/incidents/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function updateIncidentStatus(
  id: string,
  input: UpdateIncidentStatusInput,
): Promise<IncidentResponse> {
  const response = await apiClient<{
    message: string;
    incident: Incident;
  }>(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.incident;
}

export async function assignIncident(
  id: string,
  input: AssignIncidentInput,
): Promise<IncidentResponse> {
  const response = await apiClient<{
    message: string;
    incident: Incident;
  }>(`/incidents/${id}/assign`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.incident;
}

export async function getIncidentComments(
  id: string,
): Promise<IncidentCommentsResponse> {
  return apiClient<IncidentCommentsResponse>(
    `/incidents/${id}/comments`,
  );
}

export async function addIncidentComment(
  id: string,
  content: string,
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(
    `/incidents/${id}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}

export async function getIncidentEvents(
  id: string,
): Promise<IncidentTimelineResponse> {
  return apiClient<IncidentTimelineResponse>(`/incidents/${id}/events`);
}

export async function getUsers(): Promise<UsersResponse> {
  return apiClient<UsersResponse>("/users");
}

export type { IncidentPagination };