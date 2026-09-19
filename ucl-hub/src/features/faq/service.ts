import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import type { Faq } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { FaqInput } from "./schema";

export function createFaqService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<Faq>(store, COLLECTIONS.faqs);
  const stamp = () => clock.now().toISOString();

  return {
    listAll: () => crud.listAll({ orderBy: [{ field: "order" }] }),
    create: (input: FaqInput) => crud.create({ ...input, updatedAt: stamp() }),
    update: (id: string, input: FaqInput) => crud.update(id, { ...input, updatedAt: stamp() }),
    remove: crud.remove,
  };
}

export type FaqService = ReturnType<typeof createFaqService>;
