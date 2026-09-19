"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { InlineError } from "@/components/ui/States";
import { useForm } from "@/hooks/useForm";
import { emailField } from "@/lib/schemas";

const schema = z.object({ email: emailField });

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);

  const form = useForm({
    initial: { email: "" },
    schema,
    onSubmit: async ({ email }) => {
      await sendPasswordReset(email);
      setSent(true);
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-600">Enter your UCL email and we&apos;ll send you a link to choose a new password.</p>

      {sent ? (
        <div role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
        </div>
      ) : (
        <form onSubmit={form.submit} noValidate className="mt-6 space-y-4">
          <InlineError message={form.formError} />
          <TextInput label="Email" type="email" autoComplete="email" required {...form.bind("email")} />
          <Button type="submit" size="lg" className="w-full" loading={form.submitting}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
