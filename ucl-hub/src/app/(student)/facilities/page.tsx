"use client";

import { ChevronDown, MapPin, Plus, Wrench } from "lucide-react";
import { useState } from "react";
import { FacilityPriorityBadge, FacilityStatusBadge } from "@/components/common/StatusBadges";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SmartImage } from "@/components/ui/SmartImage";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { IssueTimeline } from "@/features/facilities/components/IssueTimeline";
import { ReportIssueModal } from "@/features/facilities/components/ReportIssueModal";
import { teamForCategory } from "@/features/facilities/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { FacilityIssue } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

export default function FacilitiesPage() {
  const { facilities } = useServices();
  const { user } = useCurrentUser();
  const [reporting, setReporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsyncData(() => facilities.listMine(user.uid), [facilities, user.uid]);

  const renderIssue = (issue: FacilityIssue) => {
    const expanded = openId === issue.id;
    return (
      <Card key={issue.id} className="overflow-hidden">
        <button type="button" onClick={() => setOpenId(expanded ? null : issue.id)} aria-expanded={expanded} className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{humanize(issue.category)}</h3>
              <FacilityStatusBadge status={issue.status} />
              <FacilityPriorityBadge priority={issue.priority} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="size-4 text-slate-400" aria-hidden="true" />
              {issue.location} · reported {formatDate(issue.createdAt)}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{issue.description}</p>
          </div>
          <ChevronDown className={cn("mt-1 size-5 shrink-0 text-slate-400 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
        </button>
        {expanded && (
          <div className="border-t border-slate-100 bg-slate-50/60 p-4">
            <p className="mb-3 text-sm text-slate-600">
              Handled by <strong>{teamForCategory(issue.category) === "it" ? "IT Services" : "Facilities Management"}</strong>
              {issue.assignedTo ? <> · assigned to {issue.assignedTo.name}</> : " · waiting to be assigned"}
            </p>
            {issue.imageUrl && <SmartImage src={issue.imageUrl} alt="Photo of the issue" className="mb-4 h-32 rounded-lg" />}
            <IssueTimeline updates={issue.updates} />
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Report broken equipment, air conditioning, lighting, plumbing and more, and follow each report until it's fixed."
        actions={
          <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setReporting(true)}>
            Report an issue
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingRows />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<Wrench className="size-6" aria-hidden="true" />}
          title="You haven't reported anything"
          description="If something on campus is broken or unsafe, report it here and the right team will pick it up."
          action={<Button onClick={() => setReporting(true)}>Report an issue</Button>}
        />
      ) : (
        <div className="space-y-3">{(data ?? []).map(renderIssue)}</div>
      )}

      <ReportIssueModal open={reporting} onClose={() => setReporting(false)} onCreated={reload} />
    </>
  );
}
