"use client";

import { useCurrentUser } from "@/components/providers/AuthProvider";
import { AskAiBox } from "@/features/dashboard/components/AskAiBox";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import {
  BookingStatus,
  CalendarReminders,
  FacilityAlerts,
  ImportantAnnouncements,
  JobHighlights,
  RecentUpdates,
  UpcomingEvents,
} from "@/features/dashboard/components/widgets";
import { useNow } from "@/hooks/useNow";
import { facultyById } from "@/config/academics";
import { formatDate } from "@/utils/dates";

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { profile, access } = useCurrentUser();
  const now = useNow();
  const firstName = profile.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?)\s+/i, "").split(" ")[0];
  const context =
    access.role === "student"
      ? [profile.faculty ? facultyById(profile.faculty)?.name : null, profile.programme, profile.year ? `Year ${profile.year}` : null].filter(Boolean).join(" · ")
      : "Student view";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {greeting(now)}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {formatDate(now)}
          {context && <> · {context}</>}
        </p>
      </header>

      <QuickActions />
      <AskAiBox />

      <div className="grid gap-6 lg:grid-cols-2">
        <ImportantAnnouncements now={now} />
        <UpcomingEvents now={now} />
        <CalendarReminders now={now} />
        <BookingStatus now={now} />
        <FacilityAlerts />
        <JobHighlights now={now} />
      </div>
      <RecentUpdates />
    </div>
  );
}
