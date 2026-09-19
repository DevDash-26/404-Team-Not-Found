/** Assembles the in-memory backend used for demo mode and tests. */

import { STORAGE_KEYS } from "@/config/app";
import { AppError } from "@/utils/errors";
import { toDateKey } from "@/utils/dates";
import type { UserProfile } from "@/types";
import type { AccessUpdate, AdminGateway, Backend, CreateUserInput, FileStore, UploadedFile } from "../types";
import { CREDENTIALS_COLLECTION, MemoryAuthPort, credentialKey } from "./memoryAuth";
import { MemoryStore, type DbSnapshot } from "./memoryStore";

const META_COLLECTION = "__meta";
const META_ID = "seed";

async function buildInitialSnapshot(now: Date): Promise<DbSnapshot> {
  const { buildDemoData } = await import("@/data/demo");
  const demo = buildDemoData(now);
  const credentials: DbSnapshot[string] = {};
  for (const account of demo.accounts) {
    credentials[credentialKey(account.email)] = { uid: account.uid, password: account.password };
  }
  return {
    ...demo.collections,
    [CREDENTIALS_COLLECTION]: credentials,
    [META_COLLECTION]: { [META_ID]: { day: toDateKey(now) } },
  };
}

function loadPersisted(): DbSnapshot | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEYS.memoryDb);
    return raw ? (JSON.parse(raw) as DbSnapshot) : null;
  } catch {
    return null;
  }
}

function persist(snapshot: DbSnapshot): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEYS.memoryDb, JSON.stringify(snapshot));
  } catch {
    // Quota or privacy mode: data simply stays in memory for this tab.
  }
}

/** Reads a Blob as a data URL so uploaded images can be stored inside documents. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AppError("unknown", "Could not read the file."));
    reader.readAsDataURL(blob);
  });
}

class MemoryFileStore implements FileStore {
  async upload(path: string, file: Blob): Promise<UploadedFile> {
    return { url: await blobToDataUrl(file), path };
  }

  async remove(): Promise<void> {
    // Files are embedded in documents, so there is nothing separate to remove.
  }
}

class MemoryAdminGateway implements AdminGateway {
  constructor(private readonly store: MemoryStore) {}

  async createUser(input: CreateUserInput): Promise<{ uid: string }> {
    const key = credentialKey(input.email);
    if (await this.store.get(`${CREDENTIALS_COLLECTION}/${key}`)) {
      throw new AppError("already-exists", "An account with this email already exists.");
    }
    const uid = this.store.newId("usr");
    const profile: Omit<UserProfile, "id"> = {
      name: input.name,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      staffRole: input.role === "staff" ? input.staffRole : null,
      studentId: null,
      faculty: null,
      programme: null,
      year: null,
      societyId: input.role === "staff" && input.staffRole === "society" ? input.societyId : null,
      department: input.department,
      createdAt: new Date().toISOString(),
    };
    await this.store.commit([
      { kind: "create", path: `${CREDENTIALS_COLLECTION}/${key}`, data: { uid, password: input.password } },
      { kind: "create", path: `users/${uid}`, data: profile as unknown as Record<string, unknown> },
    ]);
    return { uid };
  }

  async updateAccess(uid: string, update: AccessUpdate): Promise<void> {
    await this.store.commit([
      {
        kind: "update",
        path: `users/${uid}`,
        data: {
          role: update.role,
          staffRole: update.role === "staff" ? update.staffRole : null,
          societyId: update.role === "staff" && update.staffRole === "society" ? update.societyId : null,
        },
      },
    ]);
  }
}

export async function createMemoryBackend(now: Date = new Date()): Promise<Backend> {
  let snapshot = loadPersisted();
  const seededDay = (snapshot?.[META_COLLECTION]?.[META_ID] as { day?: string } | undefined)?.day;
  // Demo dates are relative to "today", so re-seed once per day to keep them fresh.
  if (!snapshot || seededDay !== toDateKey(now)) snapshot = await buildInitialSnapshot(now);

  const store = new MemoryStore(snapshot, persist);
  persist(snapshot);

  return {
    mode: "memory",
    store,
    auth: new MemoryAuthPort(store),
    files: new MemoryFileStore(),
    admin: new MemoryAdminGateway(store),
  };
}

/** Clears persisted demo data so the next load starts from a fresh seed. */
export function resetMemoryBackend(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.memoryDb);
    localStorage.removeItem(STORAGE_KEYS.memorySession);
  } catch {
    // Nothing to reset.
  }
}
