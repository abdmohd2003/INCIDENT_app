"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  RotateCcw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/incidents/severity-badge";
import { StatusBadge } from "@/components/incidents/status-badge";
import { useDashboardStats } from "@/hooks/dashboard/use-dashboard-stats";

const severityClasses = {
  SEV1: "bg-red-500",
  SEV2: "bg-orange-500",
  SEV3: "bg-yellow-500",
  SEV4: "bg-zinc-500",
} as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-label="Loading dashboard">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-md border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.8fr)]">
        <div className="h-80 animate-pulse rounded-md border border-border bg-card" />
        <div className="h-80 animate-pulse rounded-md border border-border bg-card" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-md border border-border bg-card" />
        <div className="h-72 animate-pulse rounded-md border border-border bg-card" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboardStats();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <main className="p-4 sm:p-6">
        <div role="alert" className="max-w-xl border border-destructive/40 bg-card p-6">
          <h1 className="font-semibold">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unable to load dashboard statistics."}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RotateCcw className={isFetching ? "animate-spin" : ""} />Retry
          </Button>
        </div>
      </main>
    );
  }

  const sev1Open = data.sev1Open;
  const noIncidents = data.bySeverity.every((item) => item.count === 0);
  const severityMax = Math.max(1, ...data.bySeverity.map((item) => item.count));

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="micro-label text-muted-foreground">Operations overview</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <Link href="/incidents" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          All incidents<ArrowUpRight className="size-4" />
        </Link>
      </header>

      {noIncidents && (
        <section className="border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          No incidents have been recorded yet. Create an incident to start tracking response activity.
        </section>
      )}

      <section aria-label="Incident statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active" value={data.active} icon={<Activity className="size-4" />} />
        <StatCard label="SEV1 open" value={sev1Open} icon={<AlertTriangle className="size-4" />} emphasis={sev1Open > 0} />
        <StatCard label="Mean time to resolve" value={data.mttrMinutes === null ? "—" : formatDuration(data.mttrMinutes)} icon={<Clock3 className="size-4" />} />
        <StatCard label="Resolved · 7 days" value={data.resolved7d} icon={<RotateCcw className="size-4" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)]">
        <div className="min-w-0 border border-border bg-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-semibold">Incidents · last 14 days</h2>
            <p className="mt-1 text-xs text-muted-foreground">Created per day</p>
          </div>
          <div className="h-64 w-full" role="img" aria-label="Bar chart of incidents created over the last 14 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { month: "numeric", day: "numeric", timeZone: "UTC" })}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={12}
                />
                <YAxis allowDecimals={false} width={32} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  labelFormatter={(value) => new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" })}
                  contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: 6, color: "var(--foreground)" }}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="count" name="Incidents" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-card p-4 sm:p-5">
          <h2 className="font-semibold">By severity</h2>
          <div className="mt-5 space-y-5">
            {data.bySeverity.map((item) => (
              <div key={item.severity}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <SeverityBadge severity={item.severity} />
                  <span className="font-mono text-sm tabular-nums">{item.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-sm bg-muted">
                  <div className={`h-full ${severityClasses[item.severity]}`} style={{ width: `${(item.count / severityMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="mb-3 text-xs font-medium uppercase text-muted-foreground">By status</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {data.byStatus.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs">
                  <StatusBadge status={item.status} />
                  <span className="font-mono tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-semibold">Top active incidents</h2>
            <span className="font-mono text-xs text-muted-foreground">{data.topActive.length}</span>
          </div>
          {data.topActive.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No active incidents.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.topActive.map((incident) => (
                <li key={incident.id} className={`border-l-2 px-4 py-3 sm:px-5 ${incident.severity === "SEV1" ? "border-l-red-500" : "border-l-transparent"}`}>
                  <Link href={`/incidents/${incident.id}`} className="block min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>
                    <p className="mt-2 truncate text-sm font-medium hover:text-primary">{incident.title}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{incident.id}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ol className="divide-y divide-border">
              {data.recentActivity.map((event) => (
                <li key={event.id} className="px-4 py-3 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm">{event.message}</p>
                      <Link href={`/incidents/${event.incident.id}`} className="mt-1 block truncate text-xs text-primary hover:underline">{event.incident.title}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{event.user?.name ?? "System"} · {event.type.replaceAll("_", " ")}</p>
                    </div>
                    <time dateTime={event.createdAt} className="shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className={`border bg-card p-4 ${emphasis ? "border-red-500/60" : "border-border"}`}>
      <div className="flex items-center justify-between gap-3 text-muted-foreground">
        <p className="text-xs font-medium">{label}</p>{icon}
      </div>
      <p className={`mt-4 font-mono text-3xl font-semibold tabular-nums ${emphasis ? "text-red-400" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours.toFixed(1)} hr`;
  return `${(hours / 24).toFixed(1)} days`;
}