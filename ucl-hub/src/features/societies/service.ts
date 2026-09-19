import { COLLECTIONS, societyInterestId } from "@/lib/backend/collections";
import { increment, type DataStore } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import { readAllPages } from "@/services/paging";
import type { ActorRef, Society, SocietyInterest } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { newActivities } from "./logic";
import type { SocietyInput } from "./schema";

export function createSocietyService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<Society>(store, COLLECTIONS.societies);
  const interestPath = (societyId: string, userId: string) =>
    `${COLLECTIONS.societyInterests}/${societyInterestId(societyId, userId)}`;

  return {
    listAll: () => crud.listAll({ orderBy: [{ field: "name" }] }),
    get: crud.get,

    async getMyInterestIds(userId: string): Promise<Set<string>> {
      const interests = await readAllPages((after) =>
        store.list<SocietyInterest>(COLLECTIONS.societyInterests, {
          where: [{ field: "userId", op: "==", value: userId }],
          limit: 100,
          after,
        }),
      );
      return new Set(interests.map((i) => i.societyId));
    },

    /** Records a student's interest in joining (once per society) and bumps the counter atomically. */
    async expressInterest(society: Society, user: ActorRef, message: string): Promise<void> {
      if ((await store.get(interestPath(society.id, user.id))) !== null) return;
      try {
        await store.commit([
          {
            kind: "create",
            path: interestPath(society.id, user.id),
            data: {
              societyId: society.id,
              userId: user.id,
              userName: user.name,
              message,
              createdAt: clock.now().toISOString(),
            },
          },
          { kind: "update", path: `${COLLECTIONS.societies}/${society.id}`, data: { interestCount: increment(1) } },
        ]);
      } catch (error) {
        if ((await store.get(interestPath(society.id, user.id))) !== null) return;
        throw error;
      }
    },

    async withdrawInterest(society: Society, user: ActorRef): Promise<void> {
      if ((await store.get(interestPath(society.id, user.id))) === null) return;
      await store.commit([
        { kind: "delete", path: interestPath(society.id, user.id) },
        { kind: "update", path: `${COLLECTIONS.societies}/${society.id}`, data: { interestCount: increment(-1) } },
      ]);
    },

    /** People interested in joining, for committee members (management view). */
    listInterests: (societyId: string) =>
      store.list<SocietyInterest>(COLLECTIONS.societyInterests, {
        where: [{ field: "societyId", op: "==", value: societyId }],
        limit: 100,
      }),

    create(input: SocietyInput): Promise<string> {
      return crud.create({ ...input, interestCount: 0, createdAt: clock.now().toISOString() });
    },

    /** Updates a society and notifies students about any newly added activity. */
    async update(id: string, input: SocietyInput, actor: ActorRef): Promise<void> {
      const existing = await crud.get(id);
      const added = existing ? newActivities(existing.activities, input.activities) : [];
      await crud.update(
        id,
        input,
        added.map((activity) =>
          notificationOp(
            store,
            {
              title: `${input.name}: ${activity.title}`,
              body: `New activity at ${activity.location}.`,
              type: "society",
              link: "/societies",
              createdBy: actor.id,
            },
            clock,
          ),
        ),
      );
    },

    remove: crud.remove,
  };
}

export type SocietyService = ReturnType<typeof createSocietyService>;
