import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/layout/AuthGate";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate require="any">
      <AppShell area="student">{children}</AppShell>
    </AuthGate>
  );
}
