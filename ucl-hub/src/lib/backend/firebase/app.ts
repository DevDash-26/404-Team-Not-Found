/**
 * Lazy Firebase initialisation for the browser.
 *
 * Nothing here runs during server rendering; it is only called from effects and
 * event handlers through the backend factory.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage, type FirebaseStorage } from "firebase/storage";
import { emulatorHosts, firebaseWebConfig, useFirebaseEmulators } from "@/config/env";

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let cached: FirebaseServices | null = null;

function createFirestore(app: FirebaseApp): Firestore {
  try {
    return initializeFirestore(app, {
      // Cached reads keep the app usable on poor or dropped connections.
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    try {
      return initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true });
    } catch {
      // Already initialised (for example after a hot reload).
      return getFirestore(app);
    }
  }
}

export function getFirebase(): FirebaseServices {
  if (cached) return cached;

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseWebConfig);
  const auth = getAuth(app);
  const db = createFirestore(app);
  const storage = getStorage(app);

  if (useFirebaseEmulators) {
    connectAuthEmulator(auth, emulatorHosts.auth, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHosts.firestoreHost, emulatorHosts.firestorePort);
    connectStorageEmulator(storage, emulatorHosts.storageHost, emulatorHosts.storagePort);
  }

  cached = { app, auth, db, storage };
  return cached;
}
