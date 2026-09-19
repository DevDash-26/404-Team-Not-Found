import { PAGINATION } from "@/config/app";
import { COLLECTIONS, eventInterestId } from "@/lib/backend/collections";
import { increment, type DataStore, type Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import { readAllPages } from "@/services/paging";
import type { ActorRef, CampusEvent, EventInterest } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { AppError } from "@/utils/errors";
import type { EventInput } from "./schema";
import { canRegisterInterest } from "./logic";

const INTEREST_CLEANUP_PAGE = 200;

export function createEventService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<CampusEvent>(store, COLLECTIONS.events);

  const interestPath = (eventId: string, userId: string) =>
    `${COLLECTIONS.eventInterests}/${eventInterestId(eventId, userId)}`;

  return {
    /** Events that have not finished yet (including ones happening now), soonest first. */
    listUpcoming(cursor?: unknown, pageSize: number = PAGINATION.pageSize): Promise<Page<CampusEvent>> {
      return crud.list({
        where: [{ field: "endsAt", op: ">=", value: clock.now().toISOString() }],
        orderBy: [{ field: "endsAt", direction: "asc" }],
        limit: pageSize,
        after: cursor,
      });
    },

    /** Finished events, most recent first. */
    listPast(cursor?: unknown, pageSize: number = PAGINATION.pageSize): Promise<Page<CampusEvent>> {
      return crud.list({
        where: [{ field: "endsAt", op: "<", value: clock.now().toISOString() }],
        orderBy: [{ field: "endsAt", direction: "desc" }],
        limit: pageSize,
        after: cursor,
      });
    },

    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<CampusEvent>> {
      return crud.list({ orderBy: [{ field: "startsAt", direction: "desc" }], limit: pageSize, after: cursor });
    },

    get: crud.get,

    /** Ids of the events a user has marked as interested. */
    async getInterestedEventIds(userId: string): Promise<Set<string>> {
      const interests = await readAllPages((after) =>
        store.list<EventInterest>(COLLECTIONS.eventInterests, {
          where: [{ field: "userId", op: "==", value: userId }],
          limit: 100,
          after,
        }),
      );
      return new Set(interests.map((i) => i.eventId));
    },

    /**
     * Registers interest: one interest document (id = event_user, so it can only
     * exist once) plus a counter increment, committed atomically. Repeating the
     * call is harmless.
     */
    async registerInterest(event: CampusEvent, user: ActorRef): Promise<void> {
      const alreadyInterested = (await store.get(interestPath(event.id, user.id))) !== null;
      if (alreadyInterested) return;

      const check = canRegisterInterest(event, false, clock.now());
      if (!check.ok) throw new AppError("validation", check.reason);

      try {
        await store.commit([
          {
            kind: "create",
            path: interestPath(event.id, user.id),
            data: { eventId: event.id, userId: user.id, createdAt: clock.now().toISOString() },
          },
          { kind: "update", path: `${COLLECTIONS.events}/${event.id}`, data: { interestCount: increment(1) } },
        ]);
      } catch (error) {
        // A concurrent duplicate (double click, second tab) already succeeded.
        if ((await store.get(interestPath(event.id, user.id))) !== null) return;
        throw error;
      }
    },

    async cancelInterest(event: CampusEvent, user: ActorRef): Promise<void> {
      if ((await store.get(interestPath(event.id, user.id))) === null) return;
      await store.commit([
        { kind: "delete", path: interestPath(event.id, user.id) },
        { kind: "update", path: `${COLLECTIONS.events}/${event.id}`, data: { interestCount: increment(-1) } },
      ]);
    },

    async create(input: EventInput, creator: ActorRef): Promise<string> {
      return crud.create(
        { ...input, interestCount: 0, createdBy: creator, createdAt: clock.now().toISOString() },
        [
          notificationOp(
            store,
            {
              title: `New event: ${input.title}`,
              body: `${input.organiser} · ${input.location}`,
              type: "event",
              link: "/events",
              createdBy: creator.id,
            },
            clock,
          ),
        ],
      );
    },

    update: (id: string, input: EventInput) => crud.update(id, input),

    /** Deletes an event together with the interest records that point at it. */
    async remove(id: string): Promise<void> {
      const { items } = await store.list<EventInterest>(COLLECTIONS.eventInterests, {
        where: [{ field: "eventId", op: "==", value: id }],
        limit: INTEREST_CLEANUP_PAGE,
      });
      await crud.remove(
        id,
        items.map((interest) => ({ kind: "delete" as const, path: `${COLLECTIONS.eventInterests}/${interest.id}` })),
      );
    },
  };
}

export type EventService = ReturnType<typeof createEventService>;
