import { getIO } from "./socket.js";
import { REALTIME_EVENTS, RealtimeEvent } from "./events.js";

export interface IncidentRealtimePayload {
  incidentId: string;
  incident?: unknown;
  userId?: string;
  status?: string;
  assignedToId?: string | null;
  comment?: unknown;
}

const publishIncidentEvent = (
  event: RealtimeEvent,
  payload: IncidentRealtimePayload,
) => {
  const io = getIO();

  io.emit(event, payload);
};

export const publishIncidentCreated = (
  payload: IncidentRealtimePayload,
) => {
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_CREATED, payload);
};

export const publishIncidentUpdated = (
  payload: IncidentRealtimePayload,
) => {
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_UPDATED, payload);
};

export const publishIncidentStatusChanged = (
  payload: IncidentRealtimePayload,
) => {
  publishIncidentEvent(
    REALTIME_EVENTS.INCIDENT_STATUS_CHANGED,
    payload,
  );
};

export const publishIncidentAssigned = (
  payload: IncidentRealtimePayload,
) => {
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_ASSIGNED, payload);
};

export const publishIncidentCommentAdded = (
  payload: IncidentRealtimePayload,
) => {
  publishIncidentEvent(
    REALTIME_EVENTS.INCIDENT_COMMENT_ADDED,
    payload,
  );
};

export const publishIncidentResolved = (
  payload: IncidentRealtimePayload,
) => {
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_RESOLVED, payload);
};