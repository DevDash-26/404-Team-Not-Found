"use client";

import { GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LinkButton } from "@/components/ui/Button";
import { APP } from "@/config/app";
import { showDemoAccounts } from "@/config/env";
import { labelFor, visibleDemoAccounts } from "@/features/users/components/DemoAccounts";
import { homeFor } from "@/lib/redirect";

const SPLASH_DURATION_MS = 900;

/** The root URL shows a brief animated splash, then either sends the visitor on (signed in) or offers a demo account to try (signed out). */
export default function RootPage() {
  const { status, access } = useAuth();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === "signed-in") router.replace(homeFor(access));
  }, [status, access, router]);

  const ready = splashDone && status !== "loading";
  const showPicker = ready && status === "signed-out" && showDemoAccounts;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="flex flex-col items-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-800 text-white shadow-pop animate-logo-in">
          <GraduationCap className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-semibold text-slate-900 animate-logo-in">{APP.name}</p>
        <p className="text-sm text-slate-500 animate-logo-in">{APP.institution}</p>
      </div>

      {!ready && (
        <div className="mt-8 size-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" role="status" aria-label="Loading" />
      )}

      {ready && !showDemoAccounts && status === "signed-out" && (
        <div className="mt-8 animate-fade-in">
          <LinkButton href="/login" size="lg">
            Continue to sign in
          </LinkButton>
        </div>
      )}

      {showPicker && (
        <div className="mt-10 w-full max-w-md animate-fade-in">
          <p className="text-center text-sm font-medium text-slate-700">Try it out with a demo account</p>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {visibleDemoAccounts().map((account) => (
              <li key={account.uid}>
                <button
                  type="button"
                  onClick={() => router.push(`/login?demo=${account.uid}`)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="block font-medium text-slate-900">{labelFor(account.profile.role, account.profile.staffRole)}</span>
                  <span className="block truncate text-slate-500">{account.email}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-center">
            <LinkButton href="/login" variant="ghost" size="sm">
              Sign in with your own account
            </LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}
