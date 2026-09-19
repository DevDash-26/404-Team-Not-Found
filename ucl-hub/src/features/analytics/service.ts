import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, WhereClause } from "@/lib/backend/types";
import type { AssistantLog, CampusEvent } from "@/types";

export interface CountRow {
  label: string;
  value: number;
}

export interface AnalyticsSnapshot {
  totals: CountRow[];
  bookingsByStatus: CountRow[];
  issuesByStatus: CountRow[];
  supportByStatus: CountRow[];
  topEvents: Array<{ id: string; title: string; interestCount: number }>;
  assistant: { total: number; answered: number; unanswered: AssistantLog[] };
}

/** Requests that are waiting for staff to act. Each staff member only asks for the queues they may see. */
export type QueueKey = "bookings" | "facilityIssues" | "lostFound" | "support" | "feedback" | "assistant";

const QUEUES: Record<QueueKey, { collection: string; where: WhereClause[] }> = {
  bookings: { collection: COLLECTIONS.bookings, where: [{ field: "status", op: "==", value: "pending" }] },
  facilityIssues: { collection: COLLECTIONS.facilityIssues, where: [{ field: "status", op: "!=", value: "resolved" }] },
  lostFound: { collection: COLLECTIONS.lostFound, where: [{ field: "status", op: "==", value: "open" }] },
  support: { collection: COLLECTIONS.supportRequests, where: [{ field: "status", op: "==", value: "open" }] },
  feedback: { collection: COLLECTIONS.feedback, where: [{ field: "status", op: "==", value: "new" }] },
  assistant: { collection: COLLECTIONS.assistantLogs, where: [{ field: "answered", op: "==", value: false }] },
};

const TOP_EVENTS = 5;
const RECENT_LOGS = 50;

/** Aggregates use Firestore count queries, so no documents are downloaded just to be counted. */
export function createAnalyticsService(store: DataStore) {
  const count = (collection: string, field?: string, value?: unknown) =>
    store.count(collection, field ? [{ field, op: "==", value }] : []);

  const byStatus = async (collection: string, statuses: readonly string[]): Promise<CountRow[]> =>
    Promise.all(statuses.map(async (status) => ({ label: status, value: await count(collection, "status", status) })));

  return {
    /** How many items are waiting in one work queue (a count query, no documents are downloaded). */
    queueCount: (key: QueueKey): Promise<number> => store.count(QUEUES[key].collection, QUEUES[key].where),

    async snapshot(): Promise<AnalyticsSnapshot> {
      const [users, students, announcements, events, societies, lostOpen, feedbackNew, jobs, faqs] = await Promise.all([
        count(COLLECTIONS.users),
        count(COLLECTIONS.users, "role", "student"),
        count(COLLECTIONS.announcements),
        count(COLLECTIONS.events),
        count(COLLECTIONS.societies),
        count(COLLECTIONS.lostFound, "status", "open"),
        count(COLLECTIONS.feedback, "status", "new"),
        count(COLLECTIONS.jobs),
        count(COLLECTIONS.faqs),
      ]);
      const [bookingsByStatus, issuesByStatus, supportByStatus, top, logs] = await Promise.all([
        byStatus(COLLECTIONS.bookings, ["pending", "approved", "rejected", "cancelled"]),
        byStatus(COLLECTIONS.facilityIssues, ["submitted", "assigned", "in-progress", "resolved"]),
        byStatus(COLLECTIONS.supportRequests, ["open", "matched", "closed"]),
        store.list<CampusEvent>(COLLECTIONS.events, { orderBy: [{ field: "interestCount", direction: "desc" }], limit: TOP_EVENTS }),
        store.list<AssistantLog>(COLLECTIONS.assistantLogs, { orderBy: [{ field: "createdAt", direction: "desc" }], limit: RECENT_LOGS }),
      ]);

      return {
        totals: [
          { label: "Users", value: users },
          { label: "Students", value: students },
          { label: "Announcements", value: announcements },
          { label: "Events", value: events },
          { label: "Societies", value: societies },
          { label: "Open lost & found", value: lostOpen },
          { label: "Job listings", value: jobs },
          { label: "FAQs", value: faqs },
          { label: "New feedback", value: feedbackNew },
        ],
        bookingsByStatus,
        issuesByStatus,
        supportByStatus,
        topEvents: top.items.map((e) => ({ id: e.id, title: e.title, interestCount: e.interestCount })),
        assistant: {
          total: logs.items.length,
          answered: logs.items.filter((l) => l.answered).length,
          unanswered: logs.items.filter((l) => !l.answered),
        },
      };
    },
  };
}

export type AnalyticsService = ReturnType<typeof createAnalyticsService>;
