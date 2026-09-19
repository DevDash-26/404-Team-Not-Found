/**
 * Typed access to public (browser-visible) environment variables.
 *
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` when the full variable name
 * is written literally, so each variable is referenced explicitly here.
 * Secrets (AI keys, service accounts) must NEVER be read in this file; they are
 * only read in `src/lib/server/*`, which is never imported by client code.
 */

export type BackendMode = "firebase" | "memory";

export const backendMode: BackendMode =
  process.env.NEXT_PUBLIC_BACKEND === "memory" ? "memory" : "firebase";

export const useFirebaseEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

export const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-ucl-hub",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const emulatorHosts = {
  auth: process.env.NEXT_PUBLIC_EMULATOR_AUTH_URL ?? "http://127.0.0.1:9099",
  firestoreHost: process.env.NEXT_PUBLIC_EMULATOR_FIRESTORE_HOST ?? "127.0.0.1",
  firestorePort: Number(process.env.NEXT_PUBLIC_EMULATOR_FIRESTORE_PORT ?? "8080"),
  storageHost: process.env.NEXT_PUBLIC_EMULATOR_STORAGE_HOST ?? "127.0.0.1",
  storagePort: Number(process.env.NEXT_PUBLIC_EMULATOR_STORAGE_PORT ?? "9199"),
};

/** Optional comma separated list, e.g. "ucl.ac.lk". Empty means any email may register. */
export const allowedEmailDomains: string[] = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

/** Shows the one-click demo accounts on the sign-in page (always on in demo/memory mode). */
export const showDemoAccounts = backendMode === "memory" || process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true";
