/**
 * Helpers that make demo data relative to "today", so the demo always looks
 * current no matter when it is seeded (events tomorrow, deadlines next week...).
 */

import { addDays, combineDateAndTime, toDateKey, startOfDay } from "@/utils/dates";
import type { WriteData } from "@/lib/backend/types";

export interface DemoContext {
  now: Date;
  /** ISO instant for `dayOffset` days from today at "HH:mm" local time. */
  at(dayOffset: number, time: string): string;
  /** `YYYY-MM-DD` key for `dayOffset` days from today. */
  day(dayOffset: number): string;
}

export function createDemoContext(now: Date): DemoContext {
  return {
    now,
    at(dayOffset, time) {
      const key = toDateKey(addDays(startOfDay(now), dayOffset));
      const date = combineDateAndTime(key, time);
      if (!date) throw new Error(`Invalid demo time ${time}`);
      return date.toISOString();
    },
    day(dayOffset) {
      return toDateKey(addDays(startOfDay(now), dayOffset));
    },
  };
}

/** Documents of one collection keyed by id (the id is not repeated inside the data). */
export type DemoCollection = Record<string, WriteData>;

/** Turns a list of `{ id, ...data }` records into a keyed collection. */
export function toCollection<T extends { id: string }>(items: T[]): DemoCollection {
  return Object.fromEntries(
    items.map(({ id, ...rest }) => [id, rest as unknown as WriteData]),
  );
}
