import type { LostFoundCategory, LostFoundItem, LostFoundStatus, LostFoundType, UserProfile } from "@/types";
import { can } from "@/lib/permissions";
import { matchesQuery } from "@/utils/text";

export interface LostFoundFilters {
  query: string;
  type: LostFoundType | "all";
  category: LostFoundCategory | "all";
  status: LostFoundStatus | "all";
}

export const DEFAULT_LOST_FOUND_FILTERS: LostFoundFilters = { query: "", type: "all", category: "all", status: "open" };

export function filterLostFound(items: LostFoundItem[], filters: LostFoundFilters): LostFoundItem[] {
  return items.filter((item) => {
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.category !== "all" && item.category !== filters.category) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    return matchesQuery([item.title, item.description, item.location, item.category], filters.query);
  });
}

/** The reporter or lost-and-found moderators may change an item's status or remove it. */
export function canManageItem(
  item: Pick<LostFoundItem, "reporter">,
  user: Pick<UserProfile, "id" | "role" | "staffRole"> | null,
): boolean {
  if (!user) return false;
  return item.reporter.id === user.id || can(user, "lostFoundModeration");
}

/** Allowed status moves: an item is open, then claimed, then resolved. Reopening is allowed from claimed. */
const NEXT: Record<LostFoundStatus, LostFoundStatus[]> = {
  open: ["claimed", "resolved"],
  claimed: ["open", "resolved"],
  resolved: [],
};

export function nextLostFoundStatuses(status: LostFoundStatus): LostFoundStatus[] {
  return NEXT[status];
}

/** Matching "lost" and "found" reports, e.g. to suggest likely matches for a lost item. */
export function suggestMatches(item: LostFoundItem, all: LostFoundItem[], limit = 3): LostFoundItem[] {
  const opposite: LostFoundType = item.type === "lost" ? "found" : "lost";
  return all
    .filter((other) => other.type === opposite && other.status === "open" && other.category === item.category)
    .filter((other) => matchesQuery([other.title, other.description], item.title.split(" ").slice(0, 2).join(" ")))
    .slice(0, limit);
}
