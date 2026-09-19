/** Building the notification feed: audience filtering, read state and derived reminders. Pure functions. */

import { NOTIFICATIONS } from "@/config/app";
import { matchesAudience, type TargetProfile } from "@/lib/audience";
import { EVERYONE, type AppNotification, type CampusEvent, type NotificationView } from "@/types";
import { formatTime, relativeDay } from "@/utils/dates";

export const REMINDER_PREFIX = "reminder-";

/**
 * Reminders for events a student marked as interested in that start soon.
 * They are computed on the device from data the user already has, so no
 * scheduled server job is needed.
 */
export function deriveEventReminders(
  events: CampusEvent[],
  interestedIds: ReadonlySet<string>,
  now: Date,
  windowHours: number = NOTIFICATIONS.reminderWindowHours,
): AppNotification[] {
  const limit = now.getTime() + windowHours * 3_600_000;
  return events
    .filter((event) => interestedIds.has(event.id))
    .filter((event) => {
      const start = new Date(event.startsAt).getTime();
      return start >= now.getTime() && start <= limit;
    })
    .map((event) => ({
      id: `${REMINDER_PREFIX}${event.id}`,
      title: `Reminder: ${event.title}`,
      body: `${relativeDay(event.startsAt, now)} at ${formatTime(event.startsAt)}, ${event.location}.`,
      type: "event" as const,
      link: "/events",
      recipientId: null,
      audience: EVERYONE,
      createdBy: "system",
      createdAt: now.toISOString(),
    }));
}

interface FeedInput {
  broadcasts: AppNotification[];
  personal: AppNotification[];
  derived: AppNotification[];
  readIds: ReadonlySet<string>;
  target: TargetProfile | null;
}

/** Merges every source into one newest-first list with read state resolved. */
export function buildNotificationFeed({ broadcasts, personal, derived, readIds, target }: FeedInput): NotificationView[] {
  const relevantBroadcasts = broadcasts.filter((n) => matchesAudience(n.audience, target));
  const derivedIds = new Set(derived.map((n) => n.id));

  const all = [...derived, ...relevantBroadcasts, ...personal];
  const unique = new Map<string, AppNotification>();
  for (const notification of all) unique.set(notification.id, notification);

  return [...unique.values()]
    .map((n) => ({ ...n, read: readIds.has(n.id), derived: derivedIds.has(n.id) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadCount(feed: NotificationView[]): number {
  return feed.filter((n) => !n.read).length;
}
