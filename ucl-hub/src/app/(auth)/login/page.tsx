"use client";

import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Field";
import { InlineError } from "@/components/ui/States";
import { showDemoAccounts } from "@/config/env";
import { DEMO_ACCOUNTS } from "@/data/demo/people";
import { DemoAccounts } from "@/features/users/components/DemoAccounts";
import { loginSchema } from "@/features/users/schema";
import { useForm } from "@/hooks/useForm";

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const notice = searchParams.get("reset") ? "If that email has an account, a reset link is on its way." : null;

  const form = useForm({
    initial: { email: "", password: "" },
    schema: loginSchema,
    // Navigation happens in RedirectIfSignedIn once the session is established.
    onSubmit: async ({ email, password }) => {
      await signIn(email, password);
      router.refresh();
    },
  });

  useEffect(() => {
    if (!showDemoAccounts) return;
    const demoUid = searchParams.get("demo");
    const account = demoUid && DEMO_ACCOUNTS.find((item) => item.uid === demoUid);
    if (account) form.setValues({ email: account.email, password: account.password });
    // The demo link is the only supported way to prefill a demo account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in with your UCL account.</p>

      {!showForm ? (
        <Button
          type="button"
          size="lg"
          variant="primary"
          icon={<LogIn className="size-5" aria-hidden="true" />}
          className="mt-8 w-full"
          onClick={() => setShowForm(true)}
        >
          Sign in
        </Button>
      ) : (
        <form onSubmit={form.submit} noValidate className="mt-6 space-y-4">
          {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
          <InlineError message={form.formError} />
          <TextInput label="Email" type="email" autoComplete="email" inputMode="email" required {...form.bind("email")} />
          <TextInput label="Password" type="password" autoComplete="current-password" required {...form.bind("password")} />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={form.submitting}>
            Sign in
          </Button>
        </form>
      )}

      {showDemoAccounts && (
        <DemoAccounts
          onPick={(email, password) => {
            form.setValues({ email, password });
            setShowForm(true);
          }}
        />
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        New student?{" "}
        <Link href="/register" className="font-medium text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
