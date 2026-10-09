import { getIO } from "./socket.js";
import {
  REALTIME_EVENTS,
  type IncidentRealtimePayload,
  type RealtimeEvent,
} from "./events.js";

const publishIncidentEvent = (
  event: RealtimeEvent,
  payload: IncidentRealtimePayload,
) => {
  getIO().emit(event, payload);
};

export const publishIncidentCreated = (payload: IncidentRealtimePayload) =>
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_CREATED, payload);

export const publishIncidentUpdated = (payload: IncidentRealtimePayload) =>
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_UPDATED, payload);

export const publishIncidentStatusChanged = (payload: IncidentRealtimePayload) =>
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_STATUS_CHANGED, payload);

export const publishIncidentAssigned = (payload: IncidentRealtimePayload) =>
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_ASSIGNED, payload);

export const publishIncidentCommentAdded = (payload: IncidentRealtimePayload) =>
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_COMMENT_ADDED, payload);

export const publishIncidentResolved = (payload: IncidentRealtimePayload) =>
  publishIncidentEvent(REALTIME_EVENTS.INCIDENT_RESOLVED, payload);
