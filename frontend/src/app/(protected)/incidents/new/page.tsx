"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

import { useCreateIncident } from "@/hooks/incidents/use-incidents";
import type { IncidentSeverity } from "@/api/incidents/types";

export default function NewIncidentPage() {
  const router = useRouter();
  const mutation = useCreateIncident();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] =
    useState<IncidentSeverity>("SEV3");

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Incident title is required.");
      return;
    }

    try {
      await mutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
      });

      toast.success("Incident created.");
      router.push("/incidents");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create incident.",
      );
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/incidents")}
        className="mb-4"
      >
        <ArrowLeft />
        Back to incidents
      </Button>

      <div className="max-w-2xl">
        <div className="mb-6">
          <p className="micro-label text-muted-foreground">
            Incident Management
          </p>

          <h1 className="mt-2 text-2xl font-semibold">
            Create incident
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create a new incident for your team.
          </p>
        </div>

        <div className="space-y-5 rounded-lg border border-border bg-card p-5">
          <div className="space-y-2">
            <label
              htmlFor="incident-title"
              className="text-sm font-medium"
            >
              Title
            </label>

            <Input
              id="incident-title"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Database latency spike"
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="incident-description"
              className="text-sm font-medium"
            >
              Description
            </label>

            <Textarea
              id="incident-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe what is happening..."
              rows={6}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="incident-severity"
              className="text-sm font-medium"
            >
              Severity
            </label>

            <select
              id="incident-severity"
              value={severity}
              onChange={(event) =>
                setSeverity(
                  event.target.value as IncidentSeverity,
                )
              }
              disabled={mutation.isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="SEV1">SEV1</option>
              <option value="SEV2">SEV2</option>
              <option value="SEV3">SEV3</option>
              <option value="SEV4">SEV4</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/incidents")}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>

            <Button
              onClick={submit}
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="animate-spin" />
              )}
              Create incident
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}