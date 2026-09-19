/**
 * Shared setup for the security-rules tests. These run against the Firebase
 * emulators (`npm run test:rules`), which load the real firestore.rules and
 * storage.rules files, so a passing run proves the rules behave as documented.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeTestEnvironment, type RulesTestContext, type RulesTestEnvironment } from "@firebase/rules-unit-testing";

export const PROJECT_ID = "demo-ucl-hub";

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8") },
    storage: { rules: readFileSync(resolve(process.cwd(), "storage.rules"), "utf8") },
  });
}

export type Who =
  | "anonymous"
  | "student"
  | "student2"
  | "admin"
  | "academic"
  | "societyRep"
  | "otherSocietyRep"
  | "facilities"
  | "finance"
  | "it";

interface Identity {
  uid: string;
  claims: Record<string, string>;
}

/** Tokens carry the claims that the server sets; the rules trust nothing else. */
const IDENTITIES: Record<Exclude<Who, "anonymous">, Identity> = {
  student: { uid: "u-student1", claims: { role: "student", email: "student@ucl.example" } },
  student2: { uid: "u-student2", claims: { role: "student", email: "kasun@ucl.example" } },
  admin: { uid: "u-admin", claims: { role: "admin", email: "admin@ucl.example" } },
  academic: { uid: "u-academic", claims: { role: "staff", staffRole: "academic", email: "academic@ucl.example" } },
  societyRep: { uid: "u-society", claims: { role: "staff", staffRole: "society", societyId: "soc-computing", email: "society@ucl.example" } },
  otherSocietyRep: { uid: "u-society2", claims: { role: "staff", staffRole: "society", societyId: "soc-drama", email: "drama@ucl.example" } },
  facilities: { uid: "u-facilities", claims: { role: "staff", staffRole: "facilities", email: "facilities@ucl.example" } },
  finance: { uid: "u-finance", claims: { role: "staff", staffRole: "finance", email: "finance@ucl.example" } },
  it: { uid: "u-it", claims: { role: "staff", staffRole: "it", email: "it@ucl.example" } },
};

export function uidOf(who: Exclude<Who, "anonymous">): string {
  return IDENTITIES[who].uid;
}

export function as(env: RulesTestEnvironment, who: Who): RulesTestContext {
  if (who === "anonymous") return env.unauthenticatedContext();
  const identity = IDENTITIES[who];
  return env.authenticatedContext(identity.uid, identity.claims);
}

/** Cloud Firestore handle for a person (modular SDK). */
export function db(env: RulesTestEnvironment, who: Who) {
  return as(env, who).firestore();
}

export const at = (offsetHours = 0): string => new Date(Date.UTC(2026, 8, 16, 10, 0, 0) + offsetHours * 3_600_000).toISOString();

export const person = (who: Exclude<Who, "anonymous">, name = who) => ({ id: uidOf(who), name });
