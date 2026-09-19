/**
 * Seeds a Firebase project (or the local emulators) with the demo dataset:
 * Firebase Authentication users with their role claims, plus every Firestore
 * collection. Safe to run repeatedly: documents are overwritten by id.
 *
 *   npm run seed:emulator                      # local emulators (npm run emulators)
 *   npm run seed -- --confirm                  # a real project (credentials from .env.local or the environment)
 *   npm run seed -- --confirm --reset          # first empty the seeded collections
 *
 * This script uses the Admin SDK, so it bypasses security rules. It never runs
 * in the browser and needs the service-account credentials described in
 * docs/ENVIRONMENT.md.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applicationDefault, cert, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type WriteBatch } from "firebase-admin/firestore";
import { parseClaims, toCustomClaims } from "../src/lib/backend/claims";
import { buildDemoData } from "../src/data/demo";

const BATCH_SIZE = 400;

/** Minimal .env.local reader so `npm run seed` works without extra dependencies. */
function loadEnvFile(name: string): void {
  const file = resolve(process.cwd(), name);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const [, key, raw] = match;
    if (!key || raw === undefined || process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

function projectId(): string {
  return process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-ucl-hub";
}

function createApp(usingEmulators: boolean): App {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (usingEmulators) return initializeApp({ projectId: projectId() });
  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId: projectId(), clientEmail, privateKey }), projectId: projectId() });
  }
  return initializeApp({ credential: applicationDefault(), projectId: projectId() });
}

async function main(): Promise<void> {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const args = new Set(process.argv.slice(2));
  const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (!usingEmulators && !args.has("--confirm")) {
    console.error(
      `Refusing to write demo data into the real project "${projectId()}" without --confirm.\n` +
        "Use `npm run seed:emulator` for the local emulators, or add --confirm if that project is meant for demos.",
    );
    process.exit(1);
  }

  const app = createApp(usingEmulators);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const data = buildDemoData(new Date());

  console.log(`Seeding ${usingEmulators ? "the local emulators" : `project ${projectId()}`}...`);

  if (args.has("--reset")) {
    for (const name of Object.keys(data.collections)) {
      await db.recursiveDelete(db.collection(name));
    }
    console.log("Emptied the seeded collections.");
  }

  // 1. Authentication users, each with the role claims that the security rules read.
  for (const account of data.accounts) {
    const claims = toCustomClaims(parseClaims(account.profile));
    try {
      await auth.getUser(account.uid);
      await auth.updateUser(account.uid, { email: account.email, password: account.password, displayName: account.profile.name, emailVerified: true });
    } catch {
      await auth.createUser({ uid: account.uid, email: account.email, password: account.password, displayName: account.profile.name, emailVerified: true });
    }
    await auth.setCustomUserClaims(account.uid, claims);
  }
  console.log(`Auth: ${data.accounts.length} accounts ready (password for all: see README).`);

  // 2. Firestore documents, in batches.
  let written = 0;
  let batch: WriteBatch = db.batch();
  let pending = 0;
  for (const [collection, docs] of Object.entries(data.collections)) {
    for (const [id, doc] of Object.entries(docs)) {
      batch.set(db.collection(collection).doc(id), doc);
      pending += 1;
      written += 1;
      if (pending === BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }
  }
  if (pending > 0) await batch.commit();
  console.log(`Firestore: ${written} documents written across ${Object.keys(data.collections).length} collections.`);
  console.log("Done. Sign in with any demo account listed in the README.");
}

main().catch((error: unknown) => {
  console.error("Seeding failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
