/** Understands simple time expressions in questions ("this week", "tomorrow", "on friday"). */

import { addDays, endOfDay, startOfDay, startOfWeek } from "@/utils/dates";
import { plainQuery } from "./text";
import type { TimeWindow } from "../types";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

/**
 * Returns the time window a question refers to, or null when it has none.
 * "This week" runs from today to Sunday (the current Monday-Sunday week).
 */
export function parseTimeWindow(query: string, now: Date): TimeWindow | null {
  const q = plainQuery(query);
  const today = startOfDay(now);

  if (/\b(today|tonight|this evening|this afternoon|this morning)\b/.test(q)) {
    return { from: today, to: endOfDay(today), label: "today" };
  }
  if (/\btomorrow\b/.test(q)) {
    const day = addDays(today, 1);
    return { from: day, to: endOfDay(day), label: "tomorrow" };
  }
  if (/\bnext week\b/.test(q)) {
    const monday = addDays(startOfWeek(today), 7);
    return { from: monday, to: endOfDay(addDays(monday, 6)), label: "next week" };
  }
  if (/\bthis week\b/.test(q)) {
    const sunday = addDays(startOfWeek(today), 6);
    return { from: today, to: endOfDay(sunday), label: "this week" };
  }
  if (/\b(this weekend|weekend)\b/.test(q)) {
    const saturday = addDays(startOfWeek(today), 5);
    const from = saturday.getTime() < today.getTime() ? today : saturday;
    return { from, to: endOfDay(addDays(startOfWeek(today), 6)), label: "this weekend" };
  }
  if (/\bnext month\b/.test(q)) {
    const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from, to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 2, 0)), label: "next month" };
  }
  if (/\bthis month\b/.test(q)) {
    return { from: today, to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)), label: "this month" };
  }

  for (const [index, name] of WEEKDAYS.entries()) {
    if (new RegExp(`\\b(on |this |next )?${name}\\b`).test(q)) {
      const ahead = (index - today.getDay() + 7) % 7;
      const day = addDays(today, ahead === 0 && /\bnext\b/.test(q) ? 7 : ahead);
      return { from: day, to: endOfDay(day), label: name };
    }
  }
  return null;
}

/** Does [start, end] overlap the window? A missing end means a single instant. */
export function overlapsWindow(start: string | undefined, end: string | undefined, window: TimeWindow): boolean {
  if (!start) return false;
  const s = new Date(start).getTime();
  const e = new Date(end ?? start).getTime();
  return s <= window.to.getTime() && e >= window.from.getTime();
}
