/** Event rules: status, capacity, interest eligibility, filtering and grouping. Pure functions. */

import type { CampusEvent, EventCategory } from "@/types";
import { addDays, endOfDay, startOfDay, startOfWeek, toDateKey } from "@/utils/dates";
import { matchesQuery } from "@/utils/text";

export type EventStatus = "upcoming" | "ongoing" | "past";
export type EventWhen = "all" | "today" | "week" | "month";

export interface EventFilters {
  query: string;
  category: EventCategory | "all";
  when: EventWhen;
}

export const DEFAULT_EVENT_FILTERS: EventFilters = { query: "", category: "all", when: "all" };

export function eventStatus(event: Pick<CampusEvent, "startsAt" | "endsAt">, now: Date): EventStatus {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  const current = now.getTime();
  if (current > end) return "past";
  if (current >= start) return "ongoing";
  return "upcoming";
}

/** Seats still available, or null when the event has no capacity limit. */
export function spotsLeft(event: Pick<CampusEvent, "capacity" | "interestCount">): number | null {
  if (event.capacity <= 0) return null;
  return Math.max(0, event.capacity - event.interestCount);
}

export function isFull(event: Pick<CampusEvent, "capacity" | "interestCount">): boolean {
  const left = spotsLeft(event);
  return left !== null && left === 0;
}

export type InterestCheck = { ok: true } | { ok: false; reason: string };

/** Decides whether a student may register interest right now. */
export function canRegisterInterest(
  event: Pick<CampusEvent, "startsAt" | "endsAt" | "capacity" | "interestCount">,
  alreadyInterested: boolean,
  now: Date,
): InterestCheck {
  if (alreadyInterested) return { ok: false, reason: "You've already registered your interest." };
  if (eventStatus(event, now) === "past") return { ok: false, reason: "This event has already finished." };
  if (isFull(event)) return { ok: false, reason: "This event is full." };
  return { ok: true };
}

function inWindow(event: Pick<CampusEvent, "startsAt" | "endsAt">, from: Date, to: Date): boolean {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  return start <= to.getTime() && end >= from.getTime();
}

export function windowFor(when: Exclude<EventWhen, "all">, now: Date): { from: Date; to: Date } {
  switch (when) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week": {
      const from = startOfWeek(now);
      return { from, to: endOfDay(addDays(from, 6)) };
    }
    case "month":
      return { from: startOfDay(now), to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  }
}

export function filterEvents(events: CampusEvent[], filters: EventFilters, now: Date): CampusEvent[] {
  const window = filters.when === "all" ? null : windowFor(filters.when, now);
  return events.filter((event) => {
    if (filters.category !== "all" && event.category !== filters.category) return false;
    if (window && !inWindow(event, window.from, window.to)) return false;
    return matchesQuery([event.title, event.description, event.location, event.organiser, event.category], filters.query);
  });
}

/** Groups events under their start day, keeping day order ascending. */
export function groupEventsByDay(events: CampusEvent[]): Array<[string, CampusEvent[]]> {
  const groups = new Map<string, CampusEvent[]>();
  for (const event of [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = toDateKey(new Date(event.startsAt));
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()];
}
