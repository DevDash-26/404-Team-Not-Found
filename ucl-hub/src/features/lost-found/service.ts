import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { fetchFilteredPage } from "@/services/paging";
import type { ActorRef, LostFoundItem, LostFoundStatus } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { AppError } from "@/utils/errors";
import { filterLostFound, nextLostFoundStatuses, type LostFoundFilters } from "./logic";
import type { LostFoundInput } from "./schema";

export function createLostFoundService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<LostFoundItem>(store, COLLECTIONS.lostFound);
  const newestFirst = [{ field: "createdAt", direction: "desc" as const }];

  return {
    /** Newest reports first. Filters run client-side, so several pages may be read to fill one. */
    list(filters: LostFoundFilters, cursor?: unknown, pageSize: number = PAGINATION.pageSize): Promise<Page<LostFoundItem>> {
      return fetchFilteredPage({
        fetchPage: (after) => crud.list({ orderBy: newestFirst, limit: pageSize, after }),
        predicate: (item) => filterLostFound([item], filters).length === 1,
        target: pageSize,
        cursor,
      });
    },

    listAll: (cursor?: unknown, pageSize: number = PAGINATION.adminPageSize) =>
      crud.list({ orderBy: newestFirst, limit: pageSize, after: cursor }),

    create(input: LostFoundInput, reporter: ActorRef): Promise<string> {
      return crud.create({
        ...input,
        contact: { type: input.contact.type, value: input.contact.type === "front-desk" ? "" : input.contact.value },
        status: "open",
        reporter,
        createdAt: clock.now().toISOString(),
      });
    },

    async updateStatus(item: LostFoundItem, status: LostFoundStatus): Promise<void> {
      if (!nextLostFoundStatuses(item.status).includes(status)) {
        throw new AppError("validation", `A ${item.status} item can't be marked as ${status}.`);
      }
      await crud.update(item.id, { status });
    },

    remove: crud.remove,
  };
}

export type LostFoundService = ReturnType<typeof createLostFoundService>;
