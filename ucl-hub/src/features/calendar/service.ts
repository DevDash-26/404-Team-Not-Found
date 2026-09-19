import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import type { CalendarEntry } from "@/types";
import type { CalendarEntryInput } from "./schema";

const RANGE_LIMIT = 200;

export function createCalendarService(store: DataStore) {
  const crud = createCrudService<CalendarEntry>(store, COLLECTIONS.calendar);

  return {
    /** Entries that overlap the inclusive range [from, to] (both `YYYY-MM-DD`). */
    async listRange(from: string, to: string): Promise<CalendarEntry[]> {
      const { items } = await crud.list({
        where: [{ field: "endDate", op: ">=", value: from }],
        orderBy: [{ field: "endDate" }],
        limit: RANGE_LIMIT,
      });
      return items.filter((entry) => entry.startDate <= to).sort((a, b) => a.startDate.localeCompare(b.startDate));
    },

    /** Entries ending on or after `from`, for reminders and the agenda view. */
    async listFrom(from: string, limit = RANGE_LIMIT): Promise<CalendarEntry[]> {
      const { items } = await crud.list({
        where: [{ field: "endDate", op: ">=", value: from }],
        orderBy: [{ field: "endDate" }],
        limit,
      });
      return items.sort((a, b) => a.startDate.localeCompare(b.startDate));
    },

    listAll: () => crud.listAll({ orderBy: [{ field: "startDate" }] }),
    create: (input: CalendarEntryInput) => crud.create(input),
    update: (id: string, input: CalendarEntryInput) => crud.update(id, input),
    remove: crud.remove,
  };
}

export type CalendarService = ReturnType<typeof createCalendarService>;
