"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/States";
import { isStaffOrAdmin } from "@/lib/permissions";

interface AuthGateProps {
  /** "any" = every signed-in user, "staff" = staff and administrators only. */
  require: "any" | "staff";
  children: ReactNode;
}

/**
 * Keeps signed-out users away from private pages and students away from the
 * admin area. This is a convenience for navigation; the real protection is the
 * Firestore security rules, which enforce the same roles on every request.
 */
export function AuthGate({ require, children }: AuthGateProps) {
  const { status, access } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const denied = status === "signed-in" && require === "staff" && !isStaffOrAdmin(access);

  useEffect(() => {
    if (status === "signed-out") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (denied) router.replace("/dashboard");
  }, [status, denied, pathname, router]);

  if (status !== "signed-in" || denied) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
        <Spinner className="size-8 text-brand-700" />
      </div>
    );
  }
  return <>{children}</>;
}
