/**
 * In-memory authentication used by the demo backend. Credentials live in the
 * same persisted snapshot as the data. This is for demos and tests only:
 * passwords are stored in plain text and there is no real security boundary.
 */

import { STORAGE_KEYS } from "@/config/app";
import { AppError } from "@/utils/errors";
import type { UserProfile } from "@/types";
import { parseClaims } from "../claims";
import type { AuthPort, RegisterInput, SessionUser } from "../types";
import type { MemoryStore } from "./memoryStore";

export const CREDENTIALS_COLLECTION = "__credentials";
export const MEMORY_TOKEN_PREFIX = "memory:";

export function credentialKey(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase());
}

interface CredentialDoc {
  id: string;
  uid: string;
  password: string;
}

function readSession(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEYS.memorySession);
  } catch {
    return null;
  }
}

function writeSession(uid: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (uid) localStorage.setItem(STORAGE_KEYS.memorySession, uid);
    else localStorage.removeItem(STORAGE_KEYS.memorySession);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
}

export class MemoryAuthPort implements AuthPort {
  private uid: string | null = readSession();
  private readonly listeners = new Set<(user: SessionUser | null) => void>();

  constructor(private readonly store: MemoryStore) {}

  private async resolveUser(): Promise<SessionUser | null> {
    if (!this.uid) return null;
    const profile = await this.store.get<UserProfile>(`users/${this.uid}`);
    if (!profile) {
      // A freshly registered account has credentials but no profile document yet.
      return { uid: this.uid, email: "", name: "New student", claims: parseClaims(null) };
    }
    return {
      uid: this.uid,
      email: profile.email,
      name: profile.name,
      claims: parseClaims({ role: profile.role, staffRole: profile.staffRole, societyId: profile.societyId }),
    };
  }

  private async emit(): Promise<void> {
    const user = await this.resolveUser();
    this.listeners.forEach((listener) => listener(user));
  }

  onChange(listener: (user: SessionUser | null) => void): () => void {
    this.listeners.add(listener);
    void this.resolveUser().then(listener);
    return () => this.listeners.delete(listener);
  }

  async signIn(email: string, password: string): Promise<void> {
    const credential = await this.store.get<CredentialDoc>(`${CREDENTIALS_COLLECTION}/${credentialKey(email)}`);
    if (!credential || credential.password !== password) {
      throw new AppError("validation", "Incorrect email or password.");
    }
    this.uid = credential.uid;
    writeSession(this.uid);
    await this.emit();
  }

  async register({ email, password }: RegisterInput): Promise<{ uid: string }> {
    const key = credentialKey(email);
    if (await this.store.get(`${CREDENTIALS_COLLECTION}/${key}`)) {
      throw new AppError("validation", "An account with this email already exists.");
    }
    const uid = this.store.newId("usr");
    await this.store.commit([{ kind: "create", path: `${CREDENTIALS_COLLECTION}/${key}`, data: { uid, password } }]);
    this.uid = uid;
    writeSession(uid);
    await this.emit();
    return { uid };
  }

  async signOut(): Promise<void> {
    this.uid = null;
    writeSession(null);
    await this.emit();
  }

  async sendPasswordReset(): Promise<void> {
    // Demo mode has no email delivery; behave like the real service and succeed silently.
  }

  async getIdToken(): Promise<string | null> {
    return this.uid ? `${MEMORY_TOKEN_PREFIX}${this.uid}` : null;
  }
}
