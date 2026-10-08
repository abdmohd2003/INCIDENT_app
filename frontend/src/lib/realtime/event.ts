export const REALTIME_EVENTS = {
  INCIDENT_CREATED: "incident.created",
  INCIDENT_UPDATED: "incident.updated",
  INCIDENT_STATUS_CHANGED: "incident.status_changed",
  INCIDENT_ASSIGNED: "incident.assigned",
  INCIDENT_COMMENT_ADDED: "incident.comment_added",
  INCIDENT_RESOLVED: "incident.resolved",
} as const;

export interface IncidentRealtimePayload {
  incidentId: string;
  incident?: unknown;
  userId?: string;
  status?: string;
  assignedToId?: string | null;
  comment?: unknown;
}