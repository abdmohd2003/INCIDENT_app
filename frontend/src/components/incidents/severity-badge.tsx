import { cn } from "@/lib/utils";

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

const severityConfig: Record<
  IncidentSeverity,
  {
    label: string;
    className: string;
  }
> = {
  SEV1: {
    label: "SEV1",
    className:
      "border-red-500/30 bg-red-500/10 text-red-400",
  },
  SEV2: {
    label: "SEV2",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-400",
  },
  SEV3: {
    label: "SEV3",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  },
  SEV4: {
    label: "SEV4",
    className:
      "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
  },
};

type SeverityBadgeProps = {
  severity: IncidentSeverity;
  className?: string;
};

export function SeverityBadge({
  severity,
  className,
}: SeverityBadgeProps) {
  const config = severityConfig[severity];

  return (
    <span
      className={cn(
        "squared-badge inline-flex items-center border px-2 py-0.5",
        "font-mono text-[11px] font-medium tracking-wide",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}