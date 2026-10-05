"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  incidentFormSchema,
  type IncidentFormValues,
} from "@/api/incidents/incident-form-schema";
import type { Incident } from "@/api/incidents/types";
import {
  useCreateIncident,
  useUpdateIncident,
} from "@/hooks/incidents/use-incidents";

type IncidentFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: Incident;
  onSuccess?: () => void;
};

export function IncidentFormDialog({
  mode,
  open,
  onOpenChange,
  incident,
  onSuccess,
}: IncidentFormDialogProps) {
  const createMutation = useCreateIncident();
  const updateMutation = useUpdateIncident(incident?.id ?? "");
  const mutation = mode === "create" ? createMutation : updateMutation;
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: mode === "edit" ? incident?.title ?? "" : "",
      description: mode === "edit" ? incident?.description ?? "" : "",
      severity: mode === "edit" ? incident?.severity ?? "" : "",
    });
  }, [open, mode, incident, form]);

  const submit = form.handleSubmit(async (values) => {
    const description = values.description.trim();
    const severity = values.severity || undefined;
    const input = {
      title: values.title,
      ...(description ? { description } : {}),
      ...(severity ? { severity } : {}),
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(input);
        toast.success("Incident created.");
      } else if (incident) {
        await updateMutation.mutateAsync(input);
        toast.success("Incident updated.");
      } else {
        return;
      }

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${mode} incident.`,
      );
    }
  });

  const pending = mutation.isPending;
  const title = mode === "create" ? "Create incident" : "Edit incident";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,42rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Record an incident for the response team."
              : "Update the incident title, description, or severity."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="incident-title" className="text-sm font-medium">
              Title <span aria-hidden="true">*</span>
            </label>
            <Input
              id="incident-title"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.title)}
              aria-describedby={form.formState.errors.title ? "incident-title-error" : undefined}
              disabled={pending}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p id="incident-title-error" role="alert" className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="incident-description"
              rows={5}
              disabled={pending}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="incident-severity" className="text-sm font-medium">
              Severity
            </label>
            <select
              id="incident-severity"
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              disabled={pending}
              {...form.register("severity")}
            >
              <option value="">Use default (SEV3)</option>
              <option value="SEV1">SEV1</option>
              <option value="SEV2">SEV2</option>
              <option value="SEV3">SEV3</option>
              <option value="SEV4">SEV4</option>
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {mode === "create" ? "Create incident" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}