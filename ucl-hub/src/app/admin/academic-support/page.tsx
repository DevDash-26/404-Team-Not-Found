"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportQueue } from "@/features/support/components/SupportQueue";

export default function AdminAcademicSupportPage() {
  return (
    <RequireCapability capability="academicSupport">
      <PageHeader title="Academic support" description="Match students who asked for peer tutoring, a study group or a mentor. They are notified when you save." />
      <SupportQueue />
    </RequireCapability>
  );
}
