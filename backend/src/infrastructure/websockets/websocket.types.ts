export const websocketEvents = {
  INCIDENT_CREATED: "incident.created",
  INCIDENT_UPDATED: "incident.updated",
  INCIDENT_STATUS_CHANGED: "incident.status_changed",
  INCIDENT_ASSIGNED: "incident.assigned",
  INCIDENT_COMMENT_ADDED: "incident.comment_added",
  INCIDENT_RESOLVED: "incident.resolved",
} as const;

export type WebSocketEventType =
  (typeof websocketEvents)[keyof typeof websocketEvents];

export interface IncidentWebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  incidentId: string;
  actorId: string;
  timestamp: string;
  data: T;
}