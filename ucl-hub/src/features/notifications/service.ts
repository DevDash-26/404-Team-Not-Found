import { NOTIFICATIONS, PAGINATION } from "@/config/app";
import { COLLECTIONS, notificationReadId } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { targetOf } from "@/lib/audience";
import { notificationOp } from "@/services/notificationOps";
import type { AppNotification, CampusEvent, EventInterest, NotificationRead, NotificationView, UserProfile } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { buildNotificationFeed, deriveEventReminders } from "./logic";
import type { BroadcastInput } from "./schema";

const newestFirst = [{ field: "createdAt", direction: "desc" as const }];

export function createNotificationService(store: DataStore, clock: Clock = systemClock) {
  return {
    /** Everything this user should see, newest first, with read state. */
    async getFeed(profile: Pick<UserProfile, "id" | "role" | "faculty" | "programme" | "year">): Promise<NotificationView[]> {
      const now = clock.now();
      const [personal, broadcasts, reads, interests, events] = await Promise.all([
        store.list<AppNotification>(COLLECTIONS.notifications, {
          where: [{ field: "recipientId", op: "==", value: profile.id }],
          orderBy: newestFirst,
          limit: NOTIFICATIONS.fetchLimit,
        }),
        store.list<AppNotification>(COLLECTIONS.notifications, {
          where: [{ field: "recipientId", op: "==", value: null }],
          orderBy: newestFirst,
          limit: NOTIFICATIONS.fetchLimit,
        }),
        store.list<NotificationRead>(COLLECTIONS.notificationReads, {
          where: [{ field: "userId", op: "==", value: profile.id }],
          limit: NOTIFICATIONS.readStateLimit,
        }),
        store.list<EventInterest>(COLLECTIONS.eventInterests, {
          where: [{ field: "userId", op: "==", value: profile.id }],
          limit: 100,
        }),
        store.list<CampusEvent>(COLLECTIONS.events, {
          where: [{ field: "endsAt", op: ">=", value: now.toISOString() }],
          orderBy: [{ field: "endsAt" }],
          limit: 30,
        }),
      ]);

      return buildNotificationFeed({
        broadcasts: broadcasts.items,
        personal: personal.items,
        derived: deriveEventReminders(events.items, new Set(interests.items.map((i) => i.eventId)), now),
        readIds: new Set(reads.items.map((r) => r.notificationId)),
        target: profile.role === "student" ? targetOf(profile) : null,
      });
    },

    async markRead(userId: string, notificationIds: string[]): Promise<void> {
      if (notificationIds.length === 0) return;
      const readAt = clock.now().toISOString();
      await store.commit(
        notificationIds.map((notificationId) => ({
          kind: "set" as const,
          path: `${COLLECTIONS.notificationReads}/${notificationReadId(userId, notificationId)}`,
          data: { userId, notificationId, readAt },
        })),
      );
    },

    /** Staff view: all notifications ever sent, newest first. */
    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<AppNotification>> {
      return store.list<AppNotification>(COLLECTIONS.notifications, { orderBy: newestFirst, limit: pageSize, after: cursor });
    },

    async broadcast(input: BroadcastInput, sender: { id: string }): Promise<void> {
      await store.commit([notificationOp(store, { ...input, createdBy: sender.id }, clock)]);
    },

    async remove(id: string): Promise<void> {
      await store.commit([{ kind: "delete", path: `${COLLECTIONS.notifications}/${id}` }]);
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
