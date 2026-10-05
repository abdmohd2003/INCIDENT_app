// src/api/incidents/types.ts

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "MITIGATING"
  | "RESOLVING"
  | "RESOLVED";

export type UserRole = "ADMIN" | "RESPONDER" | "VIEWER";

export type IncidentSortBy =
  | "createdAt"
  | "updatedAt"
  | "title"
  | "severity"
  | "status";

export type SortOrder = "asc" | "desc";

export type IncidentAssignee = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Incident = {
  id: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  createdById: string;
  assignedToId: string | null;
  assignedTo?: IncidentAssignee | null;
  createdBy?: Pick<IncidentAssignee, "id" | "name" | "email">;
};

export type IncidentListParams = {
  page?: number;
  limit?: number;
  search?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  assigneeId?: string;
  sortBy?: IncidentSortBy;
  sortOrder?: SortOrder;
};

export type IncidentPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type IncidentsResponse = {
  success: boolean;
  data: Incident[];
  pagination: IncidentPagination;
};

export type IncidentResponse = Incident | null;

export type CreateIncidentInput = {
  title: string;
  description?: string;
  severity?: IncidentSeverity;
};

export type UpdateIncidentInput = {
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
};

export type UpdateIncidentStatusInput = {
  status: IncidentStatus;
};

export type AssignIncidentInput = {
  userId: string;
};

export type IncidentComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  incidentId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type IncidentCommentsResponse = {
  comments: IncidentComment[];
};

export type IncidentEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "COMMENT_ADDED"
  | "UPDATED"
  | "RESOLVED";

export type IncidentTimelineEvent = {
  id: string;
  type: IncidentEventType;
  message: string;
  createdAt: string;
  incidentId: string;
  userId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type IncidentTimelineResponse = {
  events: IncidentTimelineEvent[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type UsersResponse = {
  users: User[];
};