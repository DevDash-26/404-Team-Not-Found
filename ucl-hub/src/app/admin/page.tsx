"use client";

import Link from "next/link";
import { useCurrentUser, useAuth } from "@/components/providers/AuthProvider";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ADMIN_NAV } from "@/config/navigation";
import { AdminWorkQueue } from "@/features/dashboard/components/AdminWorkQueue";
import { STAFF_ROLE_LABELS } from "@/types";

export default function AdminDashboardPage() {
  const { profile, access } = useCurrentUser();
  const { can } = useAuth();
  const roleLabel = access.role === "admin" ? "Administrator" : access.staffRole ? STAFF_ROLE_LABELS[access.staffRole] : "Staff";

  const areas = ADMIN_NAV.flatMap((group) => group.items).filter((item) => item.href !== "/admin" && item.capability && can(item.capability));

  return (
    <div className="space-y-8">
      <PageHeader title={`Welcome, ${profile.name.split(" ")[0]}`} description={`Signed in as ${roleLabel}. You can manage the areas below.`} />
      <AdminWorkQueue />
      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading" className="mb-3 text-base font-semibold text-slate-900">
          Your areas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="flex items-center gap-3 p-4 transition hover:border-brand-300 hover:shadow-md">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-800">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
