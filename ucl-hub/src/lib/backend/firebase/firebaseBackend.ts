import type { Backend } from "../types";
import { getFirebase } from "./app";
import { ApiAdminGateway } from "./firebaseAdminGateway";
import { FirebaseAuthPort } from "./firebaseAuth";
import { FirebaseFileStore } from "./firebaseFiles";
import { FirestoreStore } from "./firestoreStore";

export function createFirebaseBackend(): Backend {
  const { auth, db, storage } = getFirebase();
  const authPort = new FirebaseAuthPort(auth);
  return {
    mode: "firebase",
    store: new FirestoreStore(db),
    auth: authPort,
    files: new FirebaseFileStore(storage),
    admin: new ApiAdminGateway(authPort),
  };
}
