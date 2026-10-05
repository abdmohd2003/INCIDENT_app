import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { IncidentStatus } from "./status-badge";

export const STATUSES: readonly IncidentStatus[] = [
  "OPEN",
  "INVESTIGATING",
  "MITIGATING",
  "RESOLVING",
  "RESOLVED",
];

const statusLabels: Record<IncidentStatus, string> = {
  OPEN: "Open",
  INVESTIGATING: "Investigating",
  MITIGATING: "Mitigating",
  RESOLVING: "Resolving",
  RESOLVED: "Resolved",
};

type StatusStepperProps = {
  currentStatus: IncidentStatus;
  className?: string;
};

export function StatusStepper({
  currentStatus,
  className,
}: StatusStepperProps) {
  const currentIndex = STATUSES.indexOf(currentStatus);

  return (
    <div
      className={cn(
        "w-full overflow-x-auto",
        className,
      )}
      aria-label="Incident status"
    >
      <ol className="flex min-w-[520px] items-start">
        {STATUSES.map((status, index) => {
          const isCurrent = status === currentStatus;
          const isComplete = index < currentIndex;
          const isLast = index === STATUSES.length - 1;

          return (
            <li
              key={status}
              className="flex min-w-0 flex-1 items-start"
            >
              <div className="flex w-full flex-col items-center">
                <div className="flex w-full items-center">
                  <div
                    className={cn(
                      "h-px flex-1",
                      index === 0
                        ? "bg-transparent"
                        : isComplete || isCurrent
                          ? "bg-primary"
                          : "bg-border",
                    )}
                  />

                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border",
                      "font-mono text-[11px] transition-ui",
                      isComplete &&
                        "border-primary bg-primary text-primary-foreground",
                      isCurrent &&
                        "border-primary bg-primary/15 text-primary ring-4 ring-primary/10",
                      !isComplete &&
                        !isCurrent &&
                        "border-border bg-muted text-muted-foreground",
                    )}
                    aria-current={
                      isCurrent ? "step" : undefined
                    }
                  >
                    {isComplete ? (
                      <Check className="size-3.5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div
                    className={cn(
                      "h-px flex-1",
                      isLast
                        ? "bg-transparent"
                        : isComplete
                          ? "bg-primary"
                          : "bg-border",
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "mt-2 text-center text-xs",
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {statusLabels[status]}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}