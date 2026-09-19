"use client";

import { AlertOctagon, Bell, BellRing, Briefcase, CalendarDays, CheckCheck, DoorOpen, Info, LifeBuoy, UsersRound, Wrench } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { unreadCount } from "@/features/notifications/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { emitNotificationsChanged } from "@/lib/appEvents";
import type { NotificationType, NotificationView } from "@/types";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/dates";
import { toUserMessage } from "@/utils/errors";

const ICONS: Record<NotificationType, typeof Bell> = {
  announcement: Info,
  emergency: AlertOctagon,
  event: CalendarDays,
  booking: DoorOpen,
  facility: Wrench,
  job: Briefcase,
  society: UsersRound,
  support: LifeBuoy,
  system: BellRing,
};

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const { notifications } = useServices();
  const { profile } = useCurrentUser();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [readLocally, setReadLocally] = useState<ReadonlySet<string>>(new Set());
  const { data, loading, error, reload } = useAsyncData(() => notifications.getFeed(profile), [notifications, profile.id, profile.faculty, profile.programme, profile.year]);

  const feed = useMemo<NotificationView[]>(() => (data ?? []).map((n) => (readLocally.has(n.id) ? { ...n, read: true } : n)), [data, readLocally]);
  const visible = filter === "unread" ? feed.filter((n) => !n.read) : feed;
  const unread = unreadCount(feed);

  async function markRead(ids: string[]) {
    const fresh = ids.filter((id) => !readLocally.has(id));
    if (fresh.length === 0) return;
    setReadLocally((current) => new Set([...current, ...fresh]));
    try {
      await notifications.markRead(profile.id, fresh);
      emitNotificationsChanged();
    } catch (e) {
      // Roll back the optimistic change so the badge stays truthful.
      setReadLocally((current) => new Set([...current].filter((id) => !fresh.includes(id))));
      toast.error(toUserMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your bookings, reports, events and official announcements."
        actions={
          <Button variant="secondary" icon={<CheckCheck className="size-4" aria-hidden="true" />} disabled={unread === 0} onClick={() => markRead(feed.filter((n) => !n.read).map((n) => n.id))}>
            Mark all as read
          </Button>
        }
      />
      <FilterChips
        label="Show"
        className="mb-4"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: feed.length },
          { value: "unread", label: "Unread", count: unread },
        ]}
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingRows />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" aria-hidden="true" />} title={filter === "unread" ? "You're all caught up" : "No notifications yet"} description="We'll let you know when something needs your attention." />
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          {visible.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <li key={n.id} className={cn("flex items-start gap-3 p-4", !n.read && "bg-brand-50/50")}>
                <span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg", n.type === "emergency" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600")}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm text-slate-900", !n.read && "font-semibold")}>{n.title}</p>
                    {!n.read && <Badge tone="brand">New</Badge>}
                    {n.derived && <Badge>Reminder</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    <span>{formatDateTime(n.createdAt)}</span>
                    {n.link && (
                      <Link href={n.link} onClick={() => markRead([n.id])} className="font-medium text-brand-700 hover:underline">
                        Open
                      </Link>
                    )}
                  </p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" onClick={() => markRead([n.id])} aria-label={`Mark "${n.title}" as read`}>
                    Mark read
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
