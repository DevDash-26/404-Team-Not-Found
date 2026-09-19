"use client";

import { Briefcase, CalendarClock, CalendarDays, DoorOpen, MapPin, Wrench } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { BookingStatusBadge, FacilityStatusBadge } from "@/components/common/StatusBadges";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { DASHBOARD } from "@/config/app";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { sortByImportance } from "@/features/announcements/logic";
import { entriesForProfile, upcomingEntries } from "@/features/calendar/logic";
import { isUpcoming } from "@/features/classrooms/logic";
import { isOpenIssue } from "@/features/facilities/logic";
import { daysLeft, isJobOpen, sortJobs } from "@/features/jobs/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { targetOf } from "@/lib/audience";
import { formatDate, formatDateTime, relativeDay, toDateKey } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { Widget } from "./Widget";

export function ImportantAnnouncements({ now }: { now: Date }) {
  const { announcements } = useServices();
  const { profile } = useCurrentUser();
  const { data, loading, error, reload } = useAsyncData(
    () => announcements.listForProfile(profile, undefined, 12),
    [announcements, profile.id, profile.faculty, profile.programme, profile.year],
  );
  const top = useMemo(() => sortByImportance(data?.items ?? []).slice(0, DASHBOARD.recentAnnouncements), [data]);
  const featured = top[0];
  const rest = top.slice(1);

  return (
    <Widget title="Announcements" href="/announcements" loading={loading} error={error} onRetry={reload} empty={top.length === 0} emptyText="No announcements right now.">
      <div className="space-y-3">
        {featured && <AnnouncementCard announcement={featured} />}
        {rest.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {rest.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.source} · {relativeDay(a.createdAt, now)}
                  </p>
                </div>
                {a.priority !== "normal" && <Badge tone={a.priority === "emergency" ? "danger" : "warning"}>{humanize(a.priority)}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Widget>
  );
}

export function UpcomingEvents({ now }: { now: Date }) {
  const { events } = useServices();
  const { user } = useCurrentUser();
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [page, mine] = await Promise.all([events.listUpcoming(undefined, DASHBOARD.upcomingEvents + 4), events.getInterestedEventIds(user.uid)]);
      return { events: page.items, mine };
    },
    [events, user.uid],
  );
  const shown = (data?.events ?? []).slice(0, DASHBOARD.upcomingEvents);

  return (
    <Widget title="Upcoming events" href="/events" loading={loading} error={error} onRetry={reload} empty={shown.length === 0} emptyText="No upcoming events yet.">
      <ul className="divide-y divide-slate-100">
        {shown.map((event) => (
          <li key={event.id} className="flex items-start gap-3 py-2.5">
            <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-brand-50 py-1 text-brand-800">
              <span className="text-[10px] font-semibold uppercase">{new Date(event.startsAt).toLocaleDateString("en-GB", { month: "short" })}</span>
              <span className="text-lg font-bold leading-none">{new Date(event.startsAt).getDate()}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{event.title}</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="size-3" aria-hidden="true" />
                {event.location} · {relativeDay(event.startsAt, now)}
              </p>
            </div>
            {data?.mine.has(event.id) && <Badge tone="success">Interested</Badge>}
          </li>
        ))}
      </ul>
    </Widget>
  );
}

export function CalendarReminders({ now }: { now: Date }) {
  const { calendar } = useServices();
  const { profile, access } = useCurrentUser();
  const { data, loading, error, reload } = useAsyncData(() => calendar.listFrom(toDateKey(now), 60), [calendar]);
  const reminders = useMemo(() => {
    const target = access.role === "student" ? targetOf(profile) : null;
    return upcomingEntries(entriesForProfile(data ?? [], target), now, DASHBOARD.calendarLookAheadDays).slice(0, DASHBOARD.calendarReminders);
  }, [data, profile, access.role, now]);

  return (
    <Widget title="Calendar reminders" href="/calendar" loading={loading} error={error} onRetry={reload} empty={reminders.length === 0} emptyText="No dates coming up in the next few weeks.">
      <ul className="divide-y divide-slate-100">
        {reminders.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 py-2.5">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{entry.title}</p>
              <p className="text-xs text-slate-500">
                {formatDate(entry.startDate)} · {relativeDay(entry.startDate, now)}
              </p>
            </div>
            <Badge>{humanize(entry.type)}</Badge>
          </li>
        ))}
      </ul>
    </Widget>
  );
}

export function BookingStatus({ now }: { now: Date }) {
  const { classrooms } = useServices();
  const { user } = useCurrentUser();
  const { data, loading, error, reload } = useAsyncData(() => classrooms.listMine(user.uid), [classrooms, user.uid]);
  const active = useMemo(
    () =>
      (data ?? [])
        .filter((b) => (b.status === "pending" || b.status === "approved") && isUpcoming(b, now))
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
        .slice(0, 3),
    [data, now],
  );

  return (
    <Widget title="My room bookings" href="/classrooms" linkLabel="Manage" loading={loading} error={error} onRetry={reload} empty={active.length === 0} emptyText="No upcoming bookings. Need a room?">
      <ul className="divide-y divide-slate-100">
        {active.map((booking) => (
          <li key={booking.id} className="flex items-start gap-3 py-2.5">
            <DoorOpen className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{booking.roomName}</p>
              <p className="text-xs text-slate-500">
                {formatDate(booking.date)}, {booking.startTime}–{booking.endTime}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </li>
        ))}
      </ul>
    </Widget>
  );
}

export function FacilityAlerts() {
  const { facilities } = useServices();
  const { user } = useCurrentUser();
  const { data, loading, error, reload } = useAsyncData(() => facilities.listMine(user.uid), [facilities, user.uid]);
  const open = useMemo(() => (data ?? []).filter(isOpenIssue).slice(0, 3), [data]);

  return (
    <Widget title="Facility reports" href="/facilities" loading={loading} error={error} onRetry={reload} empty={open.length === 0} emptyText="No open reports. Everything you've reported is resolved.">
      <ul className="divide-y divide-slate-100">
        {open.map((issue) => (
          <li key={issue.id} className="flex items-start gap-3 py-2.5">
            <Wrench className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {humanize(issue.category)} · {issue.location}
              </p>
              <p className="text-xs text-slate-500">Updated {formatDateTime(issue.updatedAt)}</p>
            </div>
            <FacilityStatusBadge status={issue.status} />
          </li>
        ))}
      </ul>
    </Widget>
  );
}

export function JobHighlights({ now }: { now: Date }) {
  const { jobs } = useServices();
  const { data, loading, error, reload } = useAsyncData(() => jobs.list(undefined, 12), [jobs]);
  const shown = useMemo(() => sortJobs((data?.items ?? []).filter((j) => isJobOpen(j, now)), now).slice(0, DASHBOARD.jobs), [data, now]);

  return (
    <Widget title="Jobs & internships" href="/jobs" loading={loading} error={error} onRetry={reload} empty={shown.length === 0} emptyText="No open roles right now.">
      <ul className="divide-y divide-slate-100">
        {shown.map((job) => {
          const left = daysLeft(job, now);
          return (
            <li key={job.id} className="flex items-start gap-3 py-2.5">
              <Briefcase className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{job.position}</p>
                <p className="truncate text-xs text-slate-500">
                  {job.company} · {job.location}
                </p>
              </div>
              <Badge tone={left <= 3 ? "warning" : "neutral"}>{left <= 0 ? "Last day" : `${left}d left`}</Badge>
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}

export function RecentUpdates() {
  const { notifications } = useServices();
  const { profile } = useCurrentUser();
  const { data, loading, error, reload } = useAsyncData(() => notifications.getFeed(profile), [notifications, profile.id, profile.faculty, profile.programme, profile.year]);
  const recent = (data ?? []).slice(0, 4);

  return (
    <Widget title="Recent updates" href="/notifications" loading={loading} error={error} onRetry={reload} empty={recent.length === 0} emptyText="Nothing new. We'll tell you when something changes.">
      <ul className="divide-y divide-slate-100">
        {recent.map((n) => (
          <li key={n.id} className="py-2.5">
            <Link href={n.link || "/notifications"} className="block hover:underline">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" />}
                <span className="truncate">{n.title}</span>
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarClock className="size-3" aria-hidden="true" />
                {formatDateTime(n.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  );
}
