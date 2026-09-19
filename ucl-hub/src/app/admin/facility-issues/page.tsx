"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { PageHeader } from "@/components/ui/PageHeader";
import { IssueQueue } from "@/features/facilities/components/IssueQueue";

export default function AdminFacilityIssuesPage() {
  return (
    <RequireCapability capability="facilityIssues">
      <PageHeader title="Facility issues" description="Reports from students, most urgent first. Every status change is recorded and the student is notified." />
      <IssueQueue />
    </RequireCapability>
  );
}
