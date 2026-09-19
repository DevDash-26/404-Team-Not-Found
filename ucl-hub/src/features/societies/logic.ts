import type { Society, SocietyActivity, SocietyCategory } from "@/types";
import { matchesQuery } from "@/utils/text";

export interface SocietyFilters {
  query: string;
  category: SocietyCategory | "all";
}

export const DEFAULT_SOCIETY_FILTERS: SocietyFilters = { query: "", category: "all" };

export function filterSocieties(items: Society[], filters: SocietyFilters): Society[] {
  return items.filter((society) => {
    if (filters.category !== "all" && society.category !== filters.category) return false;
    return matchesQuery(
      [society.name, society.description, society.category, ...society.committee.map((c) => c.name)],
      filters.query,
    );
  });
}

/** Upcoming activities only, soonest first. */
export function upcomingActivities(society: Pick<Society, "activities">, now: Date): SocietyActivity[] {
  return society.activities
    .filter((activity) => new Date(activity.date).getTime() >= now.getTime())
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Titles present in `after` but not in `before`, used to notify students of new activities. */
export function newActivities(before: SocietyActivity[], after: SocietyActivity[]): SocietyActivity[] {
  const known = new Set(before.map((a) => `${a.title}|${a.date}`));
  return after.filter((a) => !known.has(`${a.title}|${a.date}`));
}
