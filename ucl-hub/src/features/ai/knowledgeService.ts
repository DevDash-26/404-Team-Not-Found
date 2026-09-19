import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import type { AssistantLog, KnowledgeEntry } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { KnowledgeInput } from "./knowledge/schema";

/** Administrator tools for teaching the assistant and reviewing what students asked it. */
export function createKnowledgeService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<KnowledgeEntry>(store, COLLECTIONS.knowledge);
  const stamp = () => clock.now().toISOString();

  return {
    listEntries: (cursor?: unknown) => crud.list({ orderBy: [{ field: "title" }], limit: PAGINATION.adminPageSize, after: cursor }),
    create: (input: KnowledgeInput) => crud.create({ ...input, updatedAt: stamp() }),
    update: (id: string, input: KnowledgeInput) => crud.update(id, { ...input, updatedAt: stamp() }),
    remove: crud.remove,
    listLogs: (cursor?: unknown) =>
      store.list<AssistantLog>(COLLECTIONS.assistantLogs, {
        orderBy: [{ field: "createdAt", direction: "desc" }],
        limit: PAGINATION.adminPageSize,
        after: cursor,
      }),
  };
}

export type KnowledgeService = ReturnType<typeof createKnowledgeService>;
