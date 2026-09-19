/**
 * Firebase Admin SDK (server only).
 *
 * Credentials come from environment variables that are never exposed to the
 * browser (no NEXT_PUBLIC_ prefix). Three setups are supported:
 *  1. Emulators: FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST set, no credentials needed.
 *  2. Service account values: FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (+ project id).
 *  3. Application default credentials (Google Cloud hosting, `GOOGLE_APPLICATION_CREDENTIALS`).
 */

import "server-only";
import { applicationDefault, cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function projectId(): string {
  return process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-ucl-hub";
}

function createApp(): App {
  const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (usingEmulators) return initializeApp({ projectId: projectId() });
  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId: projectId(), clientEmail, privateKey }), projectId: projectId() });
  }
  return initializeApp({ credential: applicationDefault(), projectId: projectId() });
}

export function getAdminApp(): App {
  return getApps().length > 0 ? getApp() : createApp();
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
