import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "MITIGATING"
  | "RESOLVING"
  | "RESOLVED";

const statusConfig: Record<
  IncidentStatus,
  {
    label: string;
    className: string;
  }
> = {
  OPEN: {
    label: "Open",
    className:
      "border-slate-500/30 bg-slate-500/10 text-slate-400",
  },
  INVESTIGATING: {
    label: "Investigating",
    className:
      "border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
  MITIGATING: {
    label: "Mitigating",
    className:
      "border-teal-500/30 bg-teal-500/10 text-teal-400",
  },
  RESOLVING: {
    label: "Resolving",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  RESOLVED: {
    label: "Resolved",
    className:
      "border-green-500/30 bg-green-500/10 text-green-400",
  },
};

type StatusBadgeProps = {
  status: IncidentStatus;
  className?: string;
};

export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "squared-badge inline-flex items-center gap-1.5 border px-2 py-0.5",
        "text-[11px] font-medium",
        config.className,
        className,
      )}
    >
      {status === "RESOLVED" && <Check className="size-3" />}
      {config.label}
    </span>
  );
}