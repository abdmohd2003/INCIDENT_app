"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/api/auth/register-schema";

export default function RegisterPage() {
  const router = useRouter();
  const { register: createAccount, isAuthenticated, isLoading } = useAuth();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submit = form.handleSubmit(async ({ name, email, password }) => {
    try {
      await createAccount({ name: name.trim(), email: email.trim(), password });
      toast.success("Account created.");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to register.");
    }
  });

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_38%)]"
      />

      <section className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <ShieldAlert className="size-5 text-violet-500" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join the incident response workspace.</p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-6 shadow-xl shadow-black/10 backdrop-blur">
          <form onSubmit={submit} noValidate className="space-y-4">
            <FormField id="register-name" label="Name" error={form.formState.errors.name?.message}>
              <Input
                id="register-name"
                autoComplete="name"
                aria-invalid={Boolean(form.formState.errors.name)}
                disabled={form.formState.isSubmitting}
                {...form.register("name")}
              />
            </FormField>

            <FormField id="register-email" label="Email" error={form.formState.errors.email?.message}>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(form.formState.errors.email)}
                disabled={form.formState.isSubmitting}
                {...form.register("email")}
              />
            </FormField>

            <FormField id="register-password" label="Password" error={form.formState.errors.password?.message}>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                disabled={form.formState.isSubmitting}
                {...form.register("password")}
              />
            </FormField>

            <FormField id="register-confirm-password" label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
              <Input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                disabled={form.formState.isSubmitting}
                {...form.register("confirmPassword")}
              />
            </FormField>

            <Button type="submit" className="h-10 w-full bg-violet-600 text-white hover:bg-violet-500" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              {form.formState.isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}