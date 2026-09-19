"use client";

import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import type { Capability } from "@/lib/permissions";

/** Shows a friendly "no access" message when the signed-in staff member lacks a capability. */
export function RequireCapability({ capability, children }: { capability: Capability; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(capability)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-6" aria-hidden="true" />}
        title="You don't have access to this area"
        description="Your staff role doesn't include managing this section. Ask an administrator if you think this is a mistake."
        action={<LinkButton href="/admin" variant="secondary">Back to dashboard</LinkButton>}
      />
    );
  }
  return <>{children}</>;
}
