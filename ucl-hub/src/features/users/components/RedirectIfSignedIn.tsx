"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/States";
import { homeFor, safeNext } from "@/lib/redirect";

function Redirector({ children }: { children: ReactNode }) {
  const { status, access } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));

  useEffect(() => {
    if (status === "signed-in") router.replace(next ?? homeFor(access));
  }, [status, access, next, router]);

  if (status === "loading" || status === "signed-in") {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <Spinner className="size-8 text-brand-700" />
      </div>
    );
  }
  return <>{children}</>;
}

/** Signed-in users who open the sign-in or registration pages are sent on to their home page. */
export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Redirector>{children}</Redirector>
    </Suspense>
  );
}
