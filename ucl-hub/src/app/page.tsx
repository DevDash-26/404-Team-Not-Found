"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/States";
import { homeFor } from "@/lib/redirect";

/** The root URL just routes people to the right place for their sign-in state and role. */
export default function RootPage() {
  const { status, access } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-in") router.replace(homeFor(access));
    else if (status === "signed-out") router.replace("/login");
  }, [status, access, router]);

  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="size-8 text-brand-700" />
    </div>
  );
}
