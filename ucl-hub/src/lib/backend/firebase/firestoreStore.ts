/** Firestore (client SDK) implementation of the `DataStore` port. */

import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment as firestoreIncrement,
  limit as limitTo,
  orderBy as orderByField,
  query as buildQuery,
  startAfter,
  Timestamp,
  where as whereClause,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { AppError, fromFirebaseCode } from "@/utils/errors";
import type { DataStore, Page, QuerySpec, WhereClause, WriteData, WriteOp } from "../types";
import { isIncrement } from "../types";

const DEFAULT_LIMIT = 100;

/** Recursively converts Firestore Timestamps to ISO strings so the app only sees plain data. */
function convertTimestamps(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(convertTimestamps);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertTimestamps(v)]));
  }
  return value;
}

function toDocument<T extends { id: string }>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  return { ...(convertTimestamps(snapshot.data()) as Record<string, unknown>), id: snapshot.id } as unknown as T;
}

function toFirestoreData(data: WriteData): DocumentData {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, isIncrement(value) ? firestoreIncrement(value.by) : value]),
  );
}

function assertOnline(): void {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new AppError("unavailable", "You appear to be offline.");
  }
}

async function guard<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw fromFirebaseCode((error as { code?: string }).code, error);
  }
}

export class FirestoreStore implements DataStore {
  constructor(private readonly db: Firestore) {}

  newId(collectionName: string): string {
    return doc(collection(this.db, collectionName)).id;
  }

  get<T extends { id: string }>(path: string): Promise<T | null> {
    return guard(async () => {
      const snapshot = await getDoc(doc(this.db, path));
      if (!snapshot.exists()) return null;
      return toDocument<T>(snapshot as QueryDocumentSnapshot<DocumentData>);
    });
  }

  list<T extends { id: string }>(collectionName: string, spec: QuerySpec = {}): Promise<Page<T>> {
    return guard(async () => {
      const pageSize = spec.limit ?? DEFAULT_LIMIT;
      const constraints: QueryConstraint[] = [
        ...(spec.where ?? []).map((c) => whereClause(c.field, c.op, c.value)),
        ...(spec.orderBy ?? []).map((o) => orderByField(o.field, o.direction ?? "asc")),
      ];
      if (spec.after) constraints.push(startAfter(spec.after as QueryDocumentSnapshot<DocumentData>));
      // Fetch one extra document to know whether another page exists.
      constraints.push(limitTo(pageSize + 1));

      const snapshot = await getDocs(buildQuery(collection(this.db, collectionName), ...constraints));
      const hasMore = snapshot.docs.length > pageSize;
      const kept = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;
      return {
        items: kept.map((d) => toDocument<T>(d)),
        nextCursor: hasMore ? (kept[kept.length - 1] ?? null) : null,
      };
    });
  }

  count(collectionName: string, where: WhereClause[] = []): Promise<number> {
    return guard(async () => {
      const q = buildQuery(collection(this.db, collectionName), ...where.map((c) => whereClause(c.field, c.op, c.value)));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    });
  }

  commit(ops: WriteOp[]): Promise<void> {
    return guard(async () => {
      assertOnline();
      const batch = writeBatch(this.db);
      for (const op of ops) {
        const ref = doc(this.db, op.path);
        switch (op.kind) {
          case "create":
            // Rules forbid updates on create-only collections, so this fails if the document exists.
            batch.set(ref, toFirestoreData(op.data));
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
      await batch.commit();
    });
  }
}
