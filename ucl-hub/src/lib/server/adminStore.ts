/** Firestore (Admin SDK) implementation of the `DataStore` port, used by API routes and the seed script. */

import { FieldValue, Timestamp, type DocumentData, type DocumentSnapshot, type Firestore, type Query } from "firebase-admin/firestore";
import { AppError } from "@/utils/errors";
import type { DataStore, Page, QuerySpec, WhereClause, WriteData, WriteOp } from "@/lib/backend/types";
import { isIncrement } from "@/lib/backend/types";

const DEFAULT_LIMIT = 100;

function convertTimestamps(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(convertTimestamps);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertTimestamps(v)]));
  }
  return value;
}

function toDocument<T extends { id: string }>(snapshot: DocumentSnapshot<DocumentData>): T {
  return { ...(convertTimestamps(snapshot.data() ?? {}) as Record<string, unknown>), id: snapshot.id } as unknown as T;
}

function toFirestoreData(data: WriteData): DocumentData {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, isIncrement(value) ? FieldValue.increment(value.by) : value]));
}

function applyWhere(base: Query, where: WhereClause[]): Query {
  return where.reduce<Query>((query, clause) => query.where(clause.field, clause.op, clause.value), base);
}

export class AdminFirestoreStore implements DataStore {
  constructor(private readonly db: Firestore) {}

  newId(collection: string): string {
    return this.db.collection(collection).doc().id;
  }

  async get<T extends { id: string }>(path: string): Promise<T | null> {
    const snapshot = await this.db.doc(path).get();
    return snapshot.exists ? toDocument<T>(snapshot) : null;
  }

  async list<T extends { id: string }>(collection: string, spec: QuerySpec = {}): Promise<Page<T>> {
    const pageSize = spec.limit ?? DEFAULT_LIMIT;
    let query = applyWhere(this.db.collection(collection), spec.where ?? []);
    for (const order of spec.orderBy ?? []) query = query.orderBy(order.field, order.direction ?? "asc");
    if (spec.after) query = query.startAfter(spec.after as DocumentSnapshot);
    const snapshot = await query.limit(pageSize + 1).get();
    const hasMore = snapshot.docs.length > pageSize;
    const kept = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
    return { items: kept.map((d) => toDocument<T>(d)), nextCursor: hasMore ? (kept[kept.length - 1] ?? null) : null };
  }

  async count(collection: string, where: WhereClause[] = []): Promise<number> {
    const snapshot = await applyWhere(this.db.collection(collection), where).count().get();
    return snapshot.data().count;
  }

  async commit(ops: WriteOp[]): Promise<void> {
    const batch = this.db.batch();
    for (const op of ops) {
      const ref = this.db.doc(op.path);
      switch (op.kind) {
        case "create":
          batch.create(ref, toFirestoreData(op.data));
          break;
        case "set":
          if (op.merge) batch.set(ref, toFirestoreData(op.data), { merge: true });
          else batch.set(ref, toFirestoreData(op.data));
          break;
        case "update":
          batch.update(ref, toFirestoreData(op.data));
          break;
        case "delete":
          batch.delete(ref);
          break;
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 6) throw new AppError("already-exists", "That record already exists.", { cause: error });
      throw new AppError("unavailable", "The database could not be reached.", { cause: error });
    }
  }
}
