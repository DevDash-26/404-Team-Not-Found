import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import type { ActorRef, Job } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { JobInput } from "./schema";

export function createJobService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<Job>(store, COLLECTIONS.jobs);

  return {
    /** Newest listings first; the UI applies filters and deadline ordering. */
    list(cursor?: unknown, pageSize: number = PAGINATION.pageSize): Promise<Page<Job>> {
      return crud.list({ orderBy: [{ field: "createdAt", direction: "desc" }], limit: pageSize, after: cursor });
    },

    get: crud.get,

    async create(input: JobInput, author: ActorRef): Promise<string> {
      return crud.create({ ...input, createdAt: clock.now().toISOString() }, [
        notificationOp(
          store,
          {
            title: `New ${input.type}: ${input.position}`,
            body: `${input.company} · ${input.location}. Apply by ${input.deadline}.`,
            type: "job",
            link: "/jobs",
            createdBy: author.id,
          },
          clock,
        ),
      ]);
    },

    update: (id: string, input: JobInput) => crud.update(id, input),
    remove: crud.remove,
  };
}

export type JobService = ReturnType<typeof createJobService>;
