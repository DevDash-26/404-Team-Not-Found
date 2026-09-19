/**
 * Date helpers. The app stores instants as ISO-8601 strings and calendar days
 * as `YYYY-MM-DD` keys. All display helpers work in the viewer's local time.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const MINUTES_PER_HOUR = 60;
const LOCALE = "en-GB";

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local calendar day key, e.g. "2026-09-21". */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Parses a `YYYY-MM-DD` key into a local-midnight Date. Returns null if invalid. */
export function parseDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  // Reject rollover such as 2026-02-31.
  return toDateKey(date) === key ? date : null;
}

export function isValidDateKey(key: string): boolean {
  return parseDateKey(key) !== null;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Monday-based start of the week. */
export function startOfWeek(date: Date): Date {
  const day = (date.getDay() + 6) % 7;
  return startOfDay(addDays(date, -day));
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function toIso(date: Date): string {
  return date.toISOString();
}

/** Returns a valid Date or null. Accepts ISO strings and `YYYY-MM-DD` keys. */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const key = parseDateKey(value);
  if (key) return key;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "Date to be confirmed";
  return date.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatShortDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "TBC";
  return date.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
}

export function formatTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "Date to be confirmed";
  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function formatTimeRange(startIso: string, endIso?: string | null): string {
  const start = formatTime(startIso);
  const end = endIso ? formatTime(endIso) : "";
  return end ? `${start} – ${end}` : start;
}

/** Whole calendar days from `now` to `value` (negative when in the past). */
export function daysUntil(value: string | Date, now: Date): number {
  const target = toDate(value);
  if (!target) return Number.NaN;
  return Math.round((startOfDay(target).getTime() - startOfDay(now).getTime()) / MS_PER_DAY);
}

export function relativeDay(value: string | Date, now: Date): string {
  const diff = daysUntil(value, now);
  if (Number.isNaN(diff)) return "";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function isPast(value: string | Date | null | undefined, now: Date): boolean {
  const date = toDate(value);
  return date ? date.getTime() < now.getTime() : false;
}

/** Converts "14:30" to minutes since midnight. Returns NaN for malformed input. */
export function timeToMinutes(time: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return Number.NaN;
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / MINUTES_PER_HOUR);
  const m = minutes % MINUTES_PER_HOUR;
  return `${pad2(h)}:${pad2(m)}`;
}

/** Builds a Date from a `YYYY-MM-DD` key plus an "HH:mm" time in local time. */
export function combineDateAndTime(dateKey: string, time: string): Date | null {
  const day = parseDateKey(dateKey);
  const minutes = timeToMinutes(time);
  if (!day || Number.isNaN(minutes)) return null;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_MINUTE);
}

/** Value for `<input type="datetime-local">` from an ISO string. */
export function toDateTimeLocalValue(iso: string | null | undefined): string {
  const date = toDate(iso);
  if (!date) return "";
  return `${toDateKey(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** ISO string from a `datetime-local` input value. Returns "" if invalid. */
export function fromDateTimeLocalValue(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
