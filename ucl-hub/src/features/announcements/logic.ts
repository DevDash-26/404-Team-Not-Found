/** Announcement rules: relevance, expiry, filtering and ordering. Pure functions. */

import { matchesAudience, type TargetProfile } from "@/lib/audience";
import type { Announcement, AnnouncementCategory, AnnouncementPriority } from "@/types";
import { matchesQuery } from "@/utils/text";

export interface AnnouncementFilters {
  query: string;
  category: AnnouncementCategory | "all";
  priority: AnnouncementPriority | "all";
}

export const DEFAULT_ANNOUNCEMENT_FILTERS: AnnouncementFilters = { query: "", category: "all", priority: "all" };

/** True while the announcement has not passed its optional expiry. */
export function isActive(announcement: Pick<Announcement, "expiresAt">, now: Date): boolean {
  if (!announcement.expiresAt) return true;
  const expiry = new Date(announcement.expiresAt);
  return Number.isNaN(expiry.getTime()) || expiry.getTime() > now.getTime();
}

export function isRelevantTo(announcement: Pick<Announcement, "audience">, target: TargetProfile | null): boolean {
  return matchesAudience(announcement.audience, target);
}

export function filterAnnouncements(items: Announcement[], filters: AnnouncementFilters): Announcement[] {
  return items.filter((item) => {
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.priority !== "all" && item.priority !== filters.priority) return false;
    return matchesQuery([item.title, item.description, item.source, item.author.name], filters.query);
  });
}

/**
 * The single most important currently-active emergency announcement for this
 * student, newest first. Shown as a banner across the whole app.
 */
export function pickActiveEmergency(
  items: Announcement[],
  target: TargetProfile | null,
  now: Date,
): Announcement | null {
  const candidates = items
    .filter((a) => a.priority === "emergency" && isActive(a, now) && isRelevantTo(a, target))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return candidates[0] ?? null;
}

const PRIORITY_RANK: Record<AnnouncementPriority, number> = { emergency: 0, important: 1, normal: 2 };

/** Emergency first, then important, then newest first within each level. */
export function sortByImportance(items: Announcement[]): Announcement[] {
  return [...items].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt),
  );
}
