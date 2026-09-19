import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import type { ActorRef, Feedback } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { FeedbackInput } from "./schema";

export function createFeedbackService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<Feedback>(store, COLLECTIONS.feedback);

  return {
    submit(input: FeedbackInput, from: ActorRef): Promise<string> {
      return crud.create({ ...input, status: "new", from, createdAt: clock.now().toISOString() });
    },

    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<Feedback>> {
      return crud.list({ orderBy: [{ field: "createdAt", direction: "desc" }], limit: pageSize, after: cursor });
    },

    markReviewed: (id: string) => crud.update(id, { status: "reviewed" }),
    remove: crud.remove,
  };
}

export type FeedbackService = ReturnType<typeof createFeedbackService>;
