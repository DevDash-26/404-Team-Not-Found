/**
 * In-memory implementation of the `DataStore` port.
 *
 * It mirrors the Firestore behaviours the app relies on (create-only writes,
 * atomic batches, equality/range/`in` filters, ordering, cursor pagination,
 * numeric increments) so business logic can be unit-tested without an emulator
 * and a demo can run without a Firebase project.
 *
 * It does NOT enforce security rules. Authorisation is only guaranteed by
 * Firestore rules in the Firebase backend.
 */

import { AppError } from "@/utils/errors";
import type { DataStore, Page, QuerySpec, WhereClause, WriteData, WriteOp } from "../types";
import { isIncrement } from "../types";

export type DbSnapshot = Record<string, Record<string, WriteData>>;

const DEFAULT_LIMIT = 100;

interface MemoryCursor {
  values: unknown[];
  id: string;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function splitPath(path: string): { collection: string; id: string } {
  const parts = path.split("/");
  const [collection, id] = parts;
  if (parts.length !== 2 || !collection || !id) {
    throw new AppError("validation", `Invalid document path: ${path}`);
  }
  return { collection, id };
}

function getField(doc: WriteData, field: string): unknown {
  return field.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object") return (current as Record<string, unknown>)[key];
    return undefined;
  }, doc);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Orders values the way Firestore does for the primitive types this app stores. */
function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  const left = String(a);
  const right = String(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

function isComparable(value: unknown): boolean {
  return value !== undefined && value !== null && typeof value !== "object";
}

function matches(doc: WriteData, clause: WhereClause): boolean {
  const value = getField(doc, clause.field);
  switch (clause.op) {
    case "==":
      return deepEqual(value, clause.value);
    case "!=":
      return value !== undefined && !deepEqual(value, clause.value);
    case "in":
      return Array.isArray(clause.value) && clause.value.some((candidate) => deepEqual(value, candidate));
    case "array-contains":
      return Array.isArray(value) && value.some((entry) => deepEqual(entry, clause.value));
    case "<":
      return isComparable(value) && compareValues(value, clause.value) < 0;
    case "<=":
      return isComparable(value) && compareValues(value, clause.value) <= 0;
    case ">":
      return isComparable(value) && compareValues(value, clause.value) > 0;
    case ">=":
      return isComparable(value) && compareValues(value, clause.value) >= 0;
    default:
      return false;
  }
}

function applyFieldValues(target: WriteData, patch: WriteData): void {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (isIncrement(value)) {
      const current = target[key];
      target[key] = (typeof current === "number" ? current : 0) + value.by;
    } else {
      target[key] = clone(value);
    }
  }
}

export class MemoryStore implements DataStore {
  private data: DbSnapshot;
  private counter = 0;
  private readonly onChange?: (snapshot: DbSnapshot) => void;

  constructor(initial: DbSnapshot = {}, onChange?: (snapshot: DbSnapshot) => void) {
    this.data = clone(initial);
    this.onChange = onChange;
  }

  snapshot(): DbSnapshot {
    return clone(this.data);
  }

  newId(collection: string): string {
    this.counter += 1;
    const random =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
        : Math.random().toString(36).slice(2, 18);
    return `${collection.slice(0, 3)}${random}${this.counter}`;
  }

  async get<T extends { id: string }>(path: string): Promise<T | null> {
    const { collection, id } = splitPath(path);
    const doc = this.data[collection]?.[id];
    return doc ? ({ ...clone(doc), id } as unknown as T) : null;
  }

  async list<T extends { id: string }>(collection: string, query: QuerySpec = {}): Promise<Page<T>> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const orderBy = query.orderBy ?? [];
    const table = this.data[collection] ?? {};

    let rows = Object.entries(table)
      .filter(([, doc]) => (query.where ?? []).every((clause) => matches(doc, clause)))
      // Firestore omits documents that lack a field used in orderBy.
      .filter(([, doc]) => orderBy.every((o) => getField(doc, o.field) !== undefined))
      .map(([id, doc]) => ({ id, doc }));

    rows.sort((a, b) => {
      for (const o of orderBy) {
        const cmp = compareValues(getField(a.doc, o.field), getField(b.doc, o.field));
        if (cmp !== 0) return o.direction === "desc" ? -cmp : cmp;
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    const cursor = query.after as MemoryCursor | undefined;
    if (cursor) {
      rows = rows.filter((row) => this.isAfter(row, cursor, orderBy));
    }

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const last = pageRows[pageRows.length - 1];
    const nextCursor: MemoryCursor | null =
      hasMore && last ? { id: last.id, values: orderBy.map((o) => getField(last.doc, o.field)) } : null;

    return {
      items: pageRows.map((row) => ({ ...clone(row.doc), id: row.id }) as unknown as T),
      nextCursor,
    };
  }

  async count(collection: string, where: WhereClause[] = []): Promise<number> {
    const table = this.data[collection] ?? {};
    return Object.values(table).filter((doc) => where.every((clause) => matches(doc, clause))).length;
  }

  async commit(ops: WriteOp[]): Promise<void> {
    // Work on a copy so a failing operation leaves the store untouched (atomicity).
    const draft = clone(this.data);

    for (const op of ops) {
      const { collection, id } = splitPath(op.path);
      const table = (draft[collection] ??= {});
      const existing = table[id];

      switch (op.kind) {
        case "create": {
          if (existing) throw new AppError("already-exists", `Document already exists: ${op.path}`);
          const fresh: WriteData = {};
          applyFieldValues(fresh, op.data);
          table[id] = fresh;
          break;
        }
        case "set": {
          const next: WriteData = op.merge && existing ? existing : {};
          applyFieldValues(next, op.data);
          table[id] = next;
          break;
        }
        case "update": {
          if (!existing) throw new AppError("not-found", `Document not found: ${op.path}`);
          applyFieldValues(existing, op.data);
          break;
        }
        case "delete": {
          delete table[id];
          break;
        }
      }
    }

    this.data = draft;
    this.onChange?.(this.data);
  }

  private isAfter(
    row: { id: string; doc: WriteData },
    cursor: MemoryCursor,
    orderBy: NonNullable<QuerySpec["orderBy"]>,
  ): boolean {
    for (const [index, o] of orderBy.entries()) {
      const cmp = compareValues(getField(row.doc, o.field), cursor.values[index]);
      if (cmp !== 0) return (o.direction === "desc" ? -cmp : cmp) > 0;
    }
    return row.id > cursor.id;
  }
}
