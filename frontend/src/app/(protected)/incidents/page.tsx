"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SeverityBadge } from "@/components/incidents/severity-badge";
import { StatusBadge } from "@/components/incidents/status-badge";
import { IncidentFormDialog } from "@/components/incidents/incident-form-dialog";
import { useIncidents, useUsers } from "@/hooks/incidents/use-incidents";
import { useCan } from "@/lib/auth/use-can";
import type {
  IncidentSeverity,
  IncidentSortBy,
  IncidentStatus,
  SortOrder,
} from "@/api/incidents/types";

const LIMIT = 10;
const SEVERITIES: readonly IncidentSeverity[] = ["SEV1", "SEV2", "SEV3", "SEV4"];
const STATUSES: readonly IncidentStatus[] = [
  "OPEN",
  "INVESTIGATING",
  "MITIGATING",
  "RESOLVING",
  "RESOLVED",
];
const SORT_OPTIONS: { value: IncidentSortBy; label: string }[] = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "title", label: "Title" },
  { value: "severity", label: "Severity" },
  { value: "status", label: "Status" },
];

function parsePage(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

export default function IncidentsPage() {
  const { can } = useCan();
  const canWrite = can(["ADMIN", "RESPONDER"]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const rawSeverity = searchParams.get("severity");
  const rawStatus = searchParams.get("status");
  const rawSortBy = searchParams.get("sortBy");
  const rawSortOrder = searchParams.get("sortOrder");
  const rawPage = searchParams.get("page");
  const rawAssigneeId = searchParams.get("assigneeId");
  const severity = SEVERITIES.find((value) => value === rawSeverity);
  const status = STATUSES.find((value) => value === rawStatus);
  const sortBy = SORT_OPTIONS.find((option) => option.value === rawSortBy)?.value ?? "createdAt";
  const sortOrder: SortOrder = rawSortOrder === "asc" ? "asc" : "desc";
  const page = parsePage(rawPage);
  const assigneeId = rawAssigneeId || undefined;
  const createOpen = searchParams.get("create") === "1";
  const debouncedSearch = useDebouncedValue(search);

  const updateListParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const validSortBy = SORT_OPTIONS.some((option) => option.value === rawSortBy);
    const validSeverity = !rawSeverity || SEVERITIES.includes(rawSeverity as IncidentSeverity);
    const validStatus = !rawStatus || STATUSES.includes(rawStatus as IncidentStatus);
    const validSortOrder = !rawSortOrder || rawSortOrder === "asc" || rawSortOrder === "desc";
    const validPage = !rawPage || String(page) === rawPage;

    if (!validPage || (rawSortBy && !validSortBy) || !validSeverity || !validStatus || !validSortOrder) {
      updateListParams({
        page: "1",
        sortBy: validSortBy ? rawSortBy ?? undefined : "createdAt",
        sortOrder: validSortOrder ? rawSortOrder ?? undefined : "desc",
        severity: validSeverity ? rawSeverity ?? undefined : undefined,
        status: validStatus ? rawStatus ?? undefined : undefined,
      });
    }
  }, [rawPage, rawSortBy, rawSeverity, rawStatus, rawSortOrder, page, updateListParams]);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      search: debouncedSearch.trim() || undefined,
      severity,
      status,
      assigneeId,
      sortBy,
      sortOrder,
    }),
    [page, debouncedSearch, severity, status, assigneeId, sortBy, sortOrder],
  );
  const { data, isLoading, isFetching, isError, error } = useIncidents(params);
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useUsers();
  const incidents = data?.data ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 0);
  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);
  const hasFilters = Boolean(search || severity || status || assigneeId);

  useEffect(() => {
    if (isFetching || !pagination) return;
    const lastPage = Math.max(1, pagination.totalPages);
    if (page > lastPage) updateListParams({ page: String(lastPage) });
  }, [isFetching, pagination, page, updateListParams]);

  const toggleSort = (column: IncidentSortBy) => {
    updateListParams({
      sortBy: column,
      sortOrder: sortBy === column && sortOrder === "asc" ? "desc" : "asc",
      page: "1",
    });
  };

  const clearFilters = () => {
    updateListParams({
      search: undefined,
      severity: undefined,
      status: undefined,
      assigneeId: undefined,
      page: "1",
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="micro-label text-muted-foreground">Incident Management</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor and manage active incidents.</p>
        </div>
        {canWrite && (
          <Button type="button" onClick={() => updateListParams({ create: "1" })}>
            <Plus />
            Create incident
          </Button>
        )}
      </header>

      <section className="mb-4 rounded-lg border border-border bg-card p-3" aria-label="Incident filters">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              maxLength={100}
              aria-label="Search incidents"
              onChange={(event) => {
                const value = event.target.value;
                updateListParams({ search: value || undefined, page: "1" });
              }}
              placeholder="Search incidents..."
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <SlidersHorizontal />{severity ?? "Severity"}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SEVERITIES.map((value) => (
                <DropdownMenuItem key={value} onClick={() => updateListParams({ severity: severity === value ? undefined : value, page: "1" })}>
                  {severity === value ? "✓ " : ""}{value}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              {status ?? "Status"}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STATUSES.map((value) => (
                <DropdownMenuItem key={value} onClick={() => updateListParams({ status: status === value ? undefined : value, page: "1" })}>
                  {status === value ? "✓ " : ""}{value}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              {usersLoading ? "Loading assignees..." : usersError ? "Assignees unavailable" : "Assignee"}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {usersError && <DropdownMenuItem disabled>Failed to load users</DropdownMenuItem>}
              {usersLoading && <DropdownMenuItem disabled>Loading users...</DropdownMenuItem>}
              {!usersLoading && !usersError && usersData?.users.length === 0 && (
                <DropdownMenuItem disabled>No users available</DropdownMenuItem>
              )}
              {usersData?.users.map((user) => (
                <DropdownMenuItem key={user.id} onClick={() => updateListParams({ assigneeId: assigneeId === user.id ? undefined : user.id, page: "1" })}>
                  {assigneeId === user.id ? "✓ " : ""}{user.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              Sort: {SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuItem key={option.value} onClick={() => toggleSort(option.value)}>
                  {sortBy === option.value ? "✓ " : ""}{option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button type="button" variant="outline" aria-label={`Sort ${sortOrder === "asc" ? "ascending" : "descending"}`} onClick={() => toggleSort(sortBy)}>
            {sortOrder === "asc" ? <ArrowUp /> : <ArrowDown />}
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </Button>

          {hasFilters && <Button type="button" variant="ghost" onClick={clearFilters}><X />Clear</Button>}
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Showing {showingFrom}–{showingTo} of {total} incidents</p>
        {isFetching && !isLoading && <p className="text-xs text-muted-foreground">Updating...</p>}
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center"><p className="text-sm text-muted-foreground">Loading incidents...</p></div>
      ) : isError ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-card p-8 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Failed to load incidents."}</p></div>
      ) : incidents.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium">No incidents found.</p>
          <p className="mt-1 text-sm text-muted-foreground">Try changing your filters or create a new incident.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-212.5 text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Incident</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Severity</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assignee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-4">
                      <Link href={`/incidents/${incident.id}`} className="block max-w-md">
                        <p className="font-medium hover:text-primary">{incident.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{incident.description}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-4"><SeverityBadge severity={incident.severity} /></td>
                    <td className="px-4 py-4"><StatusBadge status={incident.status} /></td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{incident.assignedTo?.name ?? "Unassigned"}</p>
                      {incident.assignedTo?.email && <p className="mt-1 text-xs text-muted-foreground">{incident.assignedTo.email}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{new Date(incident.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">Page {pagination?.page ?? page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => updateListParams({ page: String(Math.max(1, page - 1)) })}>
                <ChevronLeft />Previous
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!pagination || page >= pagination.totalPages || isFetching} onClick={() => updateListParams({ page: String(page + 1) })}>
                Next<ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      )}

      {canWrite && (
        <IncidentFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={(open) => updateListParams({ create: open ? "1" : undefined })}
          onSuccess={() => updateListParams({ page: "1", create: undefined })}
        />
      )}
    </div>
  );
}