export const REALTIME_EVENTS = {
  INCIDENT_CREATED: "incident.created",
  INCIDENT_UPDATED: "incident.updated",
  INCIDENT_STATUS_CHANGED: "incident.status_changed",
  INCIDENT_ASSIGNED: "incident.assigned",
  INCIDENT_COMMENT_ADDED: "incident.comment_added",
  INCIDENT_RESOLVED: "incident.resolved",
} as const;

export type RealtimeEvent =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export interface IncidentRealtimePayload {
  incidentId: string;
  incident?: unknown;
  userId?: string;
  status?: string;
  assignedToId?: string | null;
  commentId?: string;
}

export interface IncidentServerEvents {
  "incident.created": (payload: IncidentRealtimePayload) => void;
  "incident.updated": (payload: IncidentRealtimePayload) => void;
  "incident.status_changed": (payload: IncidentRealtimePayload) => void;
  "incident.assigned": (payload: IncidentRealtimePayload) => void;
  "incident.comment_added": (payload: IncidentRealtimePayload) => void;
  "incident.resolved": (payload: IncidentRealtimePayload) => void;
}
