/**
 * Generic typed CRUD over one collection, used by content types that need
 * nothing beyond create / read / update / delete (jobs, FAQs, services...).
 * Feature services layer their own rules and side effects on top.
 */

import type { CollectionName } from "@/lib/backend/collections";
import type { DataStore, Page, QuerySpec, WriteData, WriteOp } from "@/lib/backend/types";
import { AppError } from "@/utils/errors";
import { readAllPages } from "./paging";

export interface CrudService<T extends { id: string }> {
  list(query?: QuerySpec): Promise<Page<T>>;
  listAll(query?: Omit<QuerySpec, "after">): Promise<T[]>;
  get(id: string): Promise<T | null>;
  /** Creates a document and returns its id. `extraOps` are committed atomically with it. */
  create(data: Omit<T, "id">, extraOps?: WriteOp[]): Promise<string>;
  update(id: string, data: Partial<Omit<T, "id">>, extraOps?: WriteOp[]): Promise<void>;
  remove(id: string, extraOps?: WriteOp[]): Promise<void>;
}

export function createCrudService<T extends { id: string }>(
  store: DataStore,
  collection: CollectionName,
): CrudService<T> {
  return {
    list: (query) => store.list<T>(collection, query),

    listAll: (query) => readAllPages((after) => store.list<T>(collection, { ...query, limit: 100, after })),

    get: (id) => store.get<T>(`${collection}/${id}`),

    async create(data, extraOps = []) {
      const id = store.newId(collection);
      await store.commit([{ kind: "create", path: `${collection}/${id}`, data: data as unknown as WriteData }, ...extraOps]);
      return id;
    },

    async update(id, data, extraOps = []) {
      if (Object.keys(data).length === 0 && extraOps.length === 0) {
        throw new AppError("validation", "There is nothing to update.");
      }
      await store.commit([{ kind: "update", path: `${collection}/${id}`, data: data as unknown as WriteData }, ...extraOps]);
    },

    async remove(id, extraOps = []) {
      await store.commit([{ kind: "delete", path: `${collection}/${id}` }, ...extraOps]);
    },
  };
}
