/**
 * Backend ports.
 *
 * The rest of the app (features, services, UI) depends only on these
 * interfaces. Two adapters implement them:
 *
 *  - `firebase/`  Firebase Auth + Firestore + Storage (production, default)
 *  - `memory/`    a local in-memory/localStorage implementation used for unit
 *                 tests and for running a demo with no Firebase project.
 *
 * Keeping Firebase behind ports means business logic can be tested without an
 * emulator, and the university could move away from Firebase later by writing
 * one new adapter instead of touching every feature.
 */

import type { AccessClaims, Role, StaffRole } from "@/types";

// ---------------------------------------------------------------- Document store

export type WhereOp = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains";

export interface WhereClause {
  field: string;
  op: WhereOp;
  value: unknown;
}

export interface OrderClause {
  field: string;
  direction?: "asc" | "desc";
}

export interface QuerySpec {
  where?: WhereClause[];
  orderBy?: OrderClause[];
  limit?: number;
  /** Opaque cursor returned by a previous `list` call. */
  after?: unknown;
}

export interface Page<T> {
  items: T[];
  /** Pass to `QuerySpec.after` to fetch the next page, or null when exhausted. */
  nextCursor: unknown | null;
}

/** Marker meaning "add `by` to the current numeric value" inside a write. */
export interface IncrementSentinel {
  readonly __op: "increment";
  readonly by: number;
}

export function increment(by: number): IncrementSentinel {
  return { __op: "increment", by };
}

export function isIncrement(value: unknown): value is IncrementSentinel {
  return typeof value === "object" && value !== null && (value as { __op?: unknown }).__op === "increment";
}

export type WriteData = Record<string, unknown>;

/**
 * Operations applied atomically by `DataStore.commit`.
 *
 * `create` must fail if the document already exists. Firestore's client SDK has
 * no native create-only write, so on Firestore this guarantee comes from the
 * security rules (they forbid updating these collections); the memory adapter
 * enforces it directly.
 */
export type WriteOp =
  | { kind: "create"; path: string; data: WriteData }
  | { kind: "set"; path: string; data: WriteData; merge?: boolean }
  | { kind: "update"; path: string; data: WriteData }
  | { kind: "delete"; path: string };

export interface DataStore {
  get<T extends { id: string }>(path: string): Promise<T | null>;
  list<T extends { id: string }>(collection: string, query?: QuerySpec): Promise<Page<T>>;
  count(collection: string, where?: WhereClause[]): Promise<number>;
  /** Applies all operations atomically: either every write lands or none do. */
  commit(ops: WriteOp[]): Promise<void>;
  newId(collection: string): string;
}

// ---------------------------------------------------------------- Authentication

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  claims: AccessClaims;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface AuthPort {
  /** Subscribes to sign-in state. Returns an unsubscribe function. */
  onChange(listener: (user: SessionUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<{ uid: string }>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Bearer token for calling this app's own API routes. */
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
}

// ---------------------------------------------------------------- File storage

export interface UploadedFile {
  url: string;
  path: string;
}

export interface FileStore {
  upload(path: string, file: Blob, contentType: string): Promise<UploadedFile>;
  remove(path: string): Promise<void>;
}

// ---------------------------------------------------------------- Privileged user administration

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: Role;
  staffRole: StaffRole | null;
  societyId: string | null;
  department: string | null;
}

export interface AccessUpdate {
  role: Role;
  staffRole: StaffRole | null;
  societyId: string | null;
}

/**
 * Operations that need elevated privileges (creating staff accounts, changing
 * roles). In Firebase these run in server API routes using the Admin SDK and
 * custom claims; the browser can never grant itself a role.
 */
export interface AdminGateway {
  createUser(input: CreateUserInput): Promise<{ uid: string }>;
  updateAccess(uid: string, update: AccessUpdate): Promise<void>;
}

export interface Backend {
  mode: "firebase" | "memory";
  store: DataStore;
  auth: AuthPort;
  files: FileStore;
  admin: AdminGateway;
}
