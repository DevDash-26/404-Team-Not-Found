/**
 * Loads the raw records the assistant needs from the data store.
 *
 * Results are cached in memory for a short time and shared by all users
 * (per-user audience filtering happens afterwards, in `buildKnowledgeDocuments`),
 * so a burst of questions costs one set of reads, not one per question.
 */

import { AI } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import type {
  Announcement,
  CalendarEntry,
  CampusEvent,
  CampusService,
  Faq,
  Job,
  KnowledgeEntry,
  Room,
  Society,
  StaffContact,
} from "@/types";
import { toDateKey } from "@/utils/dates";
import type { RawKnowledge } from "./builders";

const LIMITS = {
  announcements: 40,
  events: 60,
  faqs: 100,
  services: 50,
  staff: 60,
  jobs: 60,
  calendar: 100,
  rooms: 40,
  societies: 40,
  notes: 60,
} as const;

/** Reads every knowledge source in parallel with bounded query sizes. */
export async function loadRawKnowledge(store: DataStore, now: Date): Promise<RawKnowledge> {
  const [announcements, events, faqs, services, staff, jobs, calendar, rooms, societies, notes] = await Promise.all([
    store.list<Announcement>(COLLECTIONS.announcements, { orderBy: [{ field: "createdAt", direction: "desc" }], limit: LIMITS.announcements }),
    store.list<CampusEvent>(COLLECTIONS.events, {
      where: [{ field: "endsAt", op: ">=", value: now.toISOString() }],
      orderBy: [{ field: "endsAt" }],
      limit: LIMITS.events,
    }),
    store.list<Faq>(COLLECTIONS.faqs, { orderBy: [{ field: "order" }], limit: LIMITS.faqs }),
    store.list<CampusService>(COLLECTIONS.services, { orderBy: [{ field: "name" }], limit: LIMITS.services }),
    store.list<StaffContact>(COLLECTIONS.staffDirectory, { orderBy: [{ field: "name" }], limit: LIMITS.staff }),
    store.list<Job>(COLLECTIONS.jobs, { orderBy: [{ field: "createdAt", direction: "desc" }], limit: LIMITS.jobs }),
    store.list<CalendarEntry>(COLLECTIONS.calendar, {
      where: [{ field: "endDate", op: ">=", value: toDateKey(now) }],
      orderBy: [{ field: "endDate" }],
      limit: LIMITS.calendar,
    }),
    store.list<Room>(COLLECTIONS.rooms, { orderBy: [{ field: "name" }], limit: LIMITS.rooms }),
    store.list<Society>(COLLECTIONS.societies, { orderBy: [{ field: "name" }], limit: LIMITS.societies }),
    store.list<KnowledgeEntry>(COLLECTIONS.knowledge, { orderBy: [{ field: "title" }], limit: LIMITS.notes }),
  ]);

  return {
    announcements: announcements.items,
    events: events.items,
    faqs: faqs.items,
    services: services.items,
    staff: staff.items,
    jobs: jobs.items,
    calendar: calendar.items,
    rooms: rooms.items,
    societies: societies.items,
    notes: notes.items,
  };
}

export interface KnowledgeLoader {
  load(now: Date): Promise<RawKnowledge>;
  /** Drops the cache so the next call re-reads the store (used after content changes and in tests). */
  invalidate(): void;
}

export function createCachedKnowledgeLoader(store: DataStore, ttlMs: number = AI.knowledgeCacheTtlMs): KnowledgeLoader {
  let cached: { at: number; data: Promise<RawKnowledge> } | null = null;

  return {
    load(now) {
      const current = Date.now();
      if (cached && current - cached.at < ttlMs) return cached.data;
      const data = loadRawKnowledge(store, now);
      cached = { at: current, data };
      // Do not keep a failed load around; the next question should retry.
      data.catch(() => {
        if (cached?.data === data) cached = null;
      });
      return data;
    },
    invalidate() {
      cached = null;
    },
  };
}
