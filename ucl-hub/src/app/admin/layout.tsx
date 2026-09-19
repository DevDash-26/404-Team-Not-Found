import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate require="staff">
      <AppShell area="admin">{children}</AppShell>
    </AuthGate>
  );
}
