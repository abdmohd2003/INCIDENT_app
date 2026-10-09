"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Activity, ArrowLeft, Loader2, MessageSquare, Pencil, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IncidentFormDialog } from "@/components/incidents/incident-form-dialog";
import { SeverityBadge } from "@/components/incidents/severity-badge";
import { StatusBadge } from "@/components/incidents/status-badge";
import { StatusStepper } from "@/components/incidents/status-stepper";
import { useCan } from "@/lib/auth/use-can";
import {
  useAddIncidentComment,
  useAssignIncident,
  useIncident,
  useIncidentComments,
  useIncidentTimeline,
  useUpdateIncidentStatus,
  useUsers,
} from "@/hooks/incidents/use-incidents";
import type { IncidentStatus } from "@/api/incidents/types";

const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  OPEN: "INVESTIGATING",
  INVESTIGATING: "MITIGATING",
  MITIGATING: "RESOLVING",
  RESOLVING: "RESOLVED",
  RESOLVED: null,
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: "Open",
  INVESTIGATING: "Investigating",
  MITIGATING: "Mitigating",
  RESOLVING: "Resolving",
  RESOLVED: "Resolved",
};

export default function IncidentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = useCan();
  const canMutate = can(["ADMIN", "RESPONDER"]);
  const { data: incident, isLoading, isError, error } = useIncident(id);
  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsQueryError,
  } = useIncidentComments(id);
  const {
    data: timelineData,
    isLoading: timelineLoading,
    isError: timelineError,
    error: timelineQueryError,
  } = useIncidentTimeline(id);
  const {
    data: usersData,
    isLoading: usersLoading,
    isError: usersError,
    error: usersQueryError,
  } = useUsers();
  const statusMutation = useUpdateIncidentStatus(id);
  const assignMutation = useAssignIncident(id);
  const [editOpen, setEditOpen] = useState(false);
  const [comment, setComment] = useState("");
  const commentMutation = useAddIncidentComment(id);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6" role="status">
        <p className="text-sm text-muted-foreground">Loading incident...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <Link href="/incidents" className="mb-5 inline-flex">
          <Button type="button" variant="ghost"><ArrowLeft />Back to incidents</Button>
        </Link>
        <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-6">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load incident."}
          </p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-4 sm:p-6">
        <Link href="/incidents" className="mb-5 inline-flex">
          <Button type="button" variant="ghost"><ArrowLeft />Back to incidents</Button>
        </Link>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium">Incident not found.</p>
        </div>
      </div>
    );
  }

  const nextStatus = NEXT_STATUS[incident.status];
  const currentAssignee = usersData?.users.find(
    (user) => user.id === incident.assignedToId,
  ) ?? incident.assignedTo;
  const comments = commentsData?.comments ?? [];
  const timelineEvents = timelineData?.events ?? [];

  const changeStatus = async () => {
    if (!nextStatus) return;
    try {
      await statusMutation.mutateAsync({ status: nextStatus });
      toast.success(`Incident moved to ${STATUS_LABELS[nextStatus]}.`);
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to update incident status.",
      );
    }
  };

  const assign = async (userId: string) => {
    try {
      await assignMutation.mutateAsync(userId);
      toast.success("Incident assigned.");
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to assign incident.",
      );
    }
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = comment.trim();
    if (!content) return;
    try {
      await commentMutation.mutateAsync(content);
      setComment("");
      toast.success("Comment added.");
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to add comment.",
      );
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Link href="/incidents" className="mb-5 inline-flex">
        <Button type="button" variant="ghost"><ArrowLeft />Back to incidents</Button>
      </Link>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <h1 className="wrap-break-word text-2xl font-semibold tracking-tight">{incident.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {new Date(incident.createdAt).toLocaleString()}
          </p>
        </div>

        {canMutate && (
          <div className="flex flex-wrap gap-2">
            {nextStatus && (
              <Button type="button" onClick={changeStatus} disabled={statusMutation.isPending}>
                {statusMutation.isPending && <Loader2 className="animate-spin" />}
                {nextStatus === "RESOLVED" ? "Resolve incident" : `Move to ${STATUS_LABELS[nextStatus]}`}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
        )}
      </header>

      <div className="mb-6 overflow-x-auto">
        <StatusStepper currentStatus={incident.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Incident details</h2>
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {incident.description || "No description provided."}
            </p>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Comments</h2>
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : commentsError ? (
              <p role="alert" className="text-sm text-destructive">
                {commentsQueryError instanceof Error ? commentsQueryError.message : "Failed to load comments."}
              </p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((item) => (
                  <article key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-medium">{item.user.name}</p>
                      <time dateTime={item.createdAt} className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.content}</p>
                  </article>
                ))}
              </div>
            )}

            {canMutate && (
              <form onSubmit={submitComment} className="mt-5 border-t border-border pt-4">
                <label htmlFor="incident-comment" className="sr-only">Add a comment</label>
                <Textarea
                  id="incident-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a comment..."
                  rows={4}
                  disabled={commentMutation.isPending}
                />
                <div className="mt-2 flex justify-end">
                  <Button type="submit" size="sm" disabled={commentMutation.isPending || !comment.trim()}>
                    {commentMutation.isPending && <Loader2 className="animate-spin" />}
                    Add comment
                  </Button>
                </div>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <Activity className="size-4" />Timeline
            </h2>
            {timelineLoading ? (
              <p className="text-sm text-muted-foreground">Loading timeline...</p>
            ) : timelineError ? (
              <p role="alert" className="text-sm text-destructive">
                {timelineQueryError instanceof Error ? timelineQueryError.message : "Failed to load timeline."}
              </p>
            ) : timelineEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded.</p>
            ) : (
              <ol className="space-y-4">
                {timelineEvents.map((event) => {
                  const EventIcon = event.type === "COMMENT_ADDED"
                    ? MessageSquare
                    : event.type === "ASSIGNED" || event.type === "UNASSIGNED"
                      ? UserRound
                      : event.type === "UPDATED"
                        ? Pencil
                        : Activity;

                  return (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                        <EventIcon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="text-sm font-medium">{event.type.replaceAll("_", " ")}</p>
                          <time dateTime={event.createdAt} className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString()}
                          </time>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{event.message}</p>
                        {event.user && <p className="mt-1 text-xs text-muted-foreground">{event.user.name}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Assignment</h2>
            {currentAssignee && (
              <p className="mb-3 text-sm">
                <span className="font-medium">{currentAssignee.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{currentAssignee.email}</span>
              </p>
            )}
            {canMutate && (
              usersLoading ? (
                <p className="text-sm text-muted-foreground">Loading users...</p>
              ) : usersError ? (
                <p role="alert" className="text-sm text-destructive">
                  {usersQueryError instanceof Error ? usersQueryError.message : "Failed to load users."}
                </p>
              ) : (
                <label className="block space-y-2">
                  <span className="text-xs text-muted-foreground">Assign to</span>
                  <select
                    aria-label="Assign incident to a user"
                    value={incident.assignedToId ?? ""}
                    onChange={(event) => {
                      if (event.target.value) void assign(event.target.value);
                    }}
                    disabled={assignMutation.isPending}
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm disabled:opacity-50"
                  >
                    {!incident.assignedToId && <option value="" disabled>Select a user</option>}
                    {usersData?.users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                  {assignMutation.isPending && <span className="block text-xs text-muted-foreground">Assigning...</span>}
                </label>
              )
            )}
            {!currentAssignee && !canMutate && <p className="text-sm text-muted-foreground">Unassigned</p>}
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Metadata</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Incident ID</dt>
                <dd className="mt-1 break-all font-mono text-xs">{incident.id}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created by ID</dt>
                <dd className="mt-1 break-all text-xs">{incident.createdBy?.name ?? incident.createdById}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="mt-1">{new Date(incident.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Updated</dt>
                <dd className="mt-1">{new Date(incident.updatedAt).toLocaleString()}</dd>
              </div>
              {incident.resolvedAt && (
                <div>
                  <dt className="text-xs text-muted-foreground">Resolved</dt>
                  <dd className="mt-1">{new Date(incident.resolvedAt).toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>

      <IncidentFormDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        incident={incident}
      />
    </div>
  );
}