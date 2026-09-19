import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { targetOf, type TargetProfile } from "@/lib/audience";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import { fetchFilteredPage } from "@/services/paging";
import type { ActorRef, Announcement, UserProfile } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { AnnouncementInput } from "./schema";
import { isActive, isRelevantTo, pickActiveEmergency } from "./logic";

const RECENT_EMERGENCY_LOOKUP = 15;

export function createAnnouncementService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<Announcement>(store, COLLECTIONS.announcements);

  const newestFirst = { orderBy: [{ field: "createdAt", direction: "desc" as const }] };

  return {
    /** Announcements relevant to a user (targeting applied), newest first. */
    listForProfile(
      profile: Pick<UserProfile, "faculty" | "programme" | "year" | "role"> | null,
      cursor?: unknown,
      pageSize: number = PAGINATION.pageSize,
    ): Promise<Page<Announcement>> {
      const target: TargetProfile | null = profile?.role === "student" ? targetOf(profile) : null;
      return fetchFilteredPage({
        fetchPage: (after) => crud.list({ ...newestFirst, limit: pageSize, after }),
        predicate: (a) => isRelevantTo(a, target) && isActive(a, clock.now()),
        target: pageSize,
        cursor,
      });
    },

    /** Every announcement including expired and off-audience ones (management view). */
    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<Announcement>> {
      return crud.list({ ...newestFirst, limit: pageSize, after: cursor });
    },

    /** The emergency announcement to pin at the top of the app, if any. */
    async getActiveEmergency(profile: Pick<UserProfile, "faculty" | "programme" | "year" | "role"> | null) {
      const { items } = await crud.list({ ...newestFirst, limit: RECENT_EMERGENCY_LOOKUP });
      const target = profile?.role === "student" ? targetOf(profile) : null;
      return pickActiveEmergency(items, target, clock.now());
    },

    get: crud.get,

    /** Publishes an announcement and notifies its audience in one atomic write. */
    async create(input: AnnouncementInput, author: ActorRef): Promise<string> {
      const createdAt = clock.now().toISOString();
      return crud.create(
        { ...input, author, createdAt },
        [
          notificationOp(
            store,
            {
              title: input.priority === "emergency" ? `Emergency: ${input.title}` : input.title,
              body: input.description,
              type: input.priority === "emergency" ? "emergency" : "announcement",
              link: "/announcements",
              audience: input.audience,
              createdBy: author.id,
            },
            clock,
          ),
        ],
      );
    },

    update: (id: string, input: AnnouncementInput) => crud.update(id, input),
    remove: crud.remove,
  };
}

export type AnnouncementService = ReturnType<typeof createAnnouncementService>;
