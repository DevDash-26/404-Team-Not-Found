"use client";

import { Bell, CalendarDays, CircleHelp, Megaphone, MessageSquareText, PackageSearch, Users, UsersRound, Briefcase, GraduationCap, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState, LoadingCards } from "@/components/ui/States";
import type { CountRow } from "@/features/analytics/service";
import { useAsyncData } from "@/hooks/useAsyncData";
import { humanize } from "@/utils/text";

const TOTAL_ICONS: Record<string, LucideIcon> = {
  Users,
  Students: GraduationCap,
  Announcements: Megaphone,
  Events: CalendarDays,
  Societies: UsersRound,
  "Open lost & found": PackageSearch,
  "Job listings": Briefcase,
  FAQs: CircleHelp,
  "New feedback": MessageSquareText,
};

/** Horizontal bars drawn with plain CSS: no charting library needed for a handful of numbers. */
function BarList({ rows, tone = "bg-brand-600" }: { rows: CountRow[]; tone?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-700">{humanize(row.label)}</span>
            <span className="font-semibold tabular-nums text-slate-900">{row.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
            <div className={`h-full rounded-full ${tone}`} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const { analytics } = useServices();
  const { data, loading, error, reload } = useAsyncData(() => analytics.snapshot(), [analytics]);

  return (
    <RequireCapability capability="analytics">
      <PageHeader title="Analytics" description="A live view of how the platform is being used." />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingCards count={6} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.totals.map((row) => {
              const Icon = TOTAL_ICONS[row.label] ?? Bell;
              return <StatCard key={row.label} label={row.label} value={row.value} icon={<Icon className="size-5" aria-hidden="true" />} />;
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Classroom bookings" description="By status">
              <BarList rows={data.bookingsByStatus} />
            </Panel>
            <Panel title="Facility issues" description="By status">
              <BarList rows={data.issuesByStatus} tone="bg-amber-500" />
            </Panel>
            <Panel title="Academic support" description="By status">
              <BarList rows={data.supportByStatus} tone="bg-emerald-600" />
            </Panel>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Most popular events" description="By students who registered interest">
              {data.topEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No events yet.</p>
              ) : (
                <BarList rows={data.topEvents.map((event) => ({ label: event.title, value: event.interestCount }))} tone="bg-accent-500" />
              )}
            </Panel>
            <Panel title="AI assistant" description="From the most recent questions">
              <div className="mb-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">{data.assistant.total}</p>
                  <p className="text-xs text-slate-600">questions asked</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {data.assistant.total === 0 ? "–" : `${Math.round((data.assistant.answered / data.assistant.total) * 100)}%`}
                  </p>
                  <p className="text-xs text-slate-600">answered from campus data</p>
                </div>
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Couldn&apos;t answer</h3>
              {data.assistant.unanswered.length === 0 ? (
                <p className="text-sm text-slate-500">Every recent question was answered.</p>
              ) : (
                <ul className="space-y-1.5 text-sm text-slate-700">
                  {data.assistant.unanswered.slice(0, 5).map((log) => (
                    <li key={log.id} className="truncate">“{log.question}”</li>
                  ))}
                </ul>
              )}
              <Link href="/admin/assistant" className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                Teach the assistant
              </Link>
            </Panel>
          </div>
        </div>
      )}
    </RequireCapability>
  );
}
