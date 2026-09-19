/**
 * Assembles the complete demo dataset used by:
 *  - `scripts/seed.ts`        (writes it into Firebase),
 *  - the in-memory backend    (demo mode without a Firebase project),
 *  - unit tests               (realistic fixtures for retrieval, targeting...).
 *
 * Everything is generated relative to `now`, so events are always "coming up".
 */

import { COLLECTIONS } from "@/lib/backend/collections";
import type { DbSnapshot } from "@/lib/backend/memory/memoryStore";
import { createDemoContext, toCollection, type DemoCollection } from "./context";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from "./people";
import { buildAnnouncements, buildCalendar, buildEvents, buildSocieties } from "./content";
import { buildFaqs, buildJobs, buildKnowledge, buildServices, buildStaffDirectory } from "./directory";
import {
  buildAssistantLogs,
  buildBookings,
  buildFacilityIssues,
  buildFeedback,
  buildInterests,
  buildLostFound,
  buildNotifications,
  buildRooms,
  buildSettings,
  buildSupportRequests,
} from "./activity";

export { DEMO_ACCOUNTS, DEMO_PASSWORD };
export type { DemoAccount };

export interface DemoData {
  accounts: DemoAccount[];
  collections: DbSnapshot;
}

export function buildDemoData(now: Date = new Date()): DemoData {
  const ctx = createDemoContext(now);
  const { bookings, roomSlots } = buildBookings(ctx);
  const { eventInterests, societyInterests } = buildInterests(ctx);

  const users: DemoCollection = toCollection(
    DEMO_ACCOUNTS.map((a) => ({ id: a.uid, ...a.profile, createdAt: ctx.at(-90, "09:00") })),
  );

  const collections: DbSnapshot = {
    [COLLECTIONS.users]: users,
    [COLLECTIONS.announcements]: buildAnnouncements(ctx),
    [COLLECTIONS.events]: buildEvents(ctx),
    [COLLECTIONS.eventInterests]: eventInterests,
    [COLLECTIONS.societies]: buildSocieties(ctx),
    [COLLECTIONS.societyInterests]: societyInterests,
    [COLLECTIONS.lostFound]: buildLostFound(ctx),
    [COLLECTIONS.rooms]: buildRooms(),
    [COLLECTIONS.bookings]: bookings,
    [COLLECTIONS.roomSlots]: roomSlots,
    [COLLECTIONS.facilityIssues]: buildFacilityIssues(ctx),
    [COLLECTIONS.supportRequests]: buildSupportRequests(ctx),
    [COLLECTIONS.calendar]: buildCalendar(ctx),
    [COLLECTIONS.jobs]: buildJobs(ctx),
    [COLLECTIONS.services]: buildServices(ctx),
    [COLLECTIONS.staffDirectory]: buildStaffDirectory(ctx),
    [COLLECTIONS.faqs]: buildFaqs(ctx),
    [COLLECTIONS.notifications]: buildNotifications(ctx),
    [COLLECTIONS.notificationReads]: {},
    [COLLECTIONS.feedback]: buildFeedback(ctx),
    [COLLECTIONS.knowledge]: buildKnowledge(ctx),
    [COLLECTIONS.assistantLogs]: buildAssistantLogs(ctx),
    [COLLECTIONS.settings]: buildSettings(),
  };

  return { accounts: DEMO_ACCOUNTS, collections };
}
