/** Academic calendar rules: audience filtering, day expansion and month grids. Pure functions. */

import { matchesAudience, type TargetProfile } from "@/lib/audience";
import type { CalendarEntry, CalendarType } from "@/types";
import { addDays, parseDateKey, startOfDay, startOfWeek, toDateKey } from "@/utils/dates";

const DAYS_IN_GRID = 42;

export const CALENDAR_TYPE_LABELS: Record<CalendarType, string> = {
  semester: "Semester",
  exam: "Exams",
  assignment: "Assignment",
  "add-drop": "Add/drop & registration",
  holiday: "Holiday",
  other: "Other",
};

export function entriesForProfile(entries: CalendarEntry[], target: TargetProfile | null): CalendarEntry[] {
  return entries.filter((entry) => matchesAudience(entry.audience, target));
}

export function filterByType(entries: CalendarEntry[], type: CalendarType | "all"): CalendarEntry[] {
  return type === "all" ? entries : entries.filter((entry) => entry.type === type);
}

/** Does the entry cover this `YYYY-MM-DD` day? */
export function coversDay(entry: Pick<CalendarEntry, "startDate" | "endDate">, dateKey: string): boolean {
  return entry.startDate <= dateKey && dateKey <= entry.endDate;
}

export function entriesOnDay(entries: CalendarEntry[], dateKey: string): CalendarEntry[] {
  return entries.filter((entry) => coversDay(entry, dateKey));
}

/** Entries that end today or later, soonest first, optionally within `days` days. */
export function upcomingEntries(entries: CalendarEntry[], now: Date, days?: number): CalendarEntry[] {
  const today = toDateKey(now);
  const limit = days === undefined ? null : toDateKey(addDays(startOfDay(now), days));
  return entries
    .filter((entry) => entry.endDate >= today && (limit === null || entry.startDate <= limit))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function isMultiDay(entry: Pick<CalendarEntry, "startDate" | "endDate">): boolean {
  return entry.startDate !== entry.endDate;
}

export interface GridDay {
  dateKey: string;
  inMonth: boolean;
  isToday: boolean;
}

/** A 6-week (Monday-first) grid for the month containing `anchor`. */
export function buildMonthGrid(anchor: Date, now: Date): GridDay[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(firstOfMonth);
  const todayKey = toDateKey(now);
  return Array.from({ length: DAYS_IN_GRID }, (_, index) => {
    const date = addDays(start, index);
    return {
      dateKey: toDateKey(date),
      inMonth: date.getMonth() === anchor.getMonth(),
      isToday: toDateKey(date) === todayKey,
    };
  });
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** First and last day keys visible in the grid for a month, used to fetch just that range. */
export function gridRange(anchor: Date): { from: string; to: string } {
  const start = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  return { from: toDateKey(start), to: toDateKey(addDays(start, DAYS_IN_GRID - 1)) };
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

export function parseEntryDate(entry: Pick<CalendarEntry, "startDate">): Date | null {
  return parseDateKey(entry.startDate);
}

/** What the calendar is filtered to. An empty value means "any". */
export interface CalendarSelection {
  faculty: string;
  programme: string;
  year: number | null;
}

/**
 * Entries relevant to a chosen faculty / programme / year. Entries aimed at
 * everyone always match; targeted ones must include every value the user chose.
 */
export function entriesForSelection(entries: CalendarEntry[], selection: CalendarSelection): CalendarEntry[] {
  return entries.filter(({ audience }) => {
    const facultyOk = !selection.faculty || audience.faculties.length === 0 || audience.faculties.includes(selection.faculty);
    const programmeOk = !selection.programme || audience.programmes.length === 0 || audience.programmes.includes(selection.programme);
    const yearOk = selection.year === null || audience.years.length === 0 || audience.years.includes(selection.year);
    return facultyOk && programmeOk && yearOk;
  });
}
