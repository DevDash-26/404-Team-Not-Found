/** Firebase Authentication implementation of the `AuthPort`. */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";
import { AppError } from "@/utils/errors";
import { parseClaims } from "../claims";
import type { AuthPort, RegisterInput, SessionUser } from "../types";

const AUTH_MESSAGES: Record<string, { code: ConstructorParameters<typeof AppError>[0]; message: string }> = {
  "auth/invalid-credential": { code: "validation", message: "Incorrect email or password." },
  "auth/wrong-password": { code: "validation", message: "Incorrect email or password." },
  "auth/user-not-found": { code: "validation", message: "Incorrect email or password." },
  "auth/invalid-email": { code: "validation", message: "Please enter a valid email address." },
  "auth/email-already-in-use": { code: "validation", message: "An account with this email already exists." },
  "auth/weak-password": { code: "validation", message: "Choose a stronger password (at least 8 characters)." },
  "auth/user-disabled": { code: "permission-denied", message: "This account has been disabled. Contact the administrator." },
  "auth/too-many-requests": { code: "rate-limited", message: "Too many attempts. Please wait a few minutes and try again." },
  "auth/network-request-failed": { code: "unavailable", message: "We couldn't reach the server. Check your connection." },
};

function mapAuthError(error: unknown): AppError {
  const code = (error as { code?: string }).code ?? "";
  const known = AUTH_MESSAGES[code];
  return known
    ? new AppError(known.code, known.message, { cause: error })
    : new AppError("unknown", "Something went wrong. Please try again.", { cause: error });
}

async function toSessionUser(user: User): Promise<SessionUser> {
  const token = await user.getIdTokenResult();
  return {
    uid: user.uid,
    email: user.email ?? "",
    name: user.displayName ?? user.email ?? "Student",
    claims: parseClaims(token.claims),
  };
}

export class FirebaseAuthPort implements AuthPort {
  constructor(private readonly auth: Auth) {}

  onChange(listener: (user: SessionUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        listener(null);
        return;
      }
      toSessionUser(user)
        .then(listener)
        .catch(() => listener(null));
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email.trim(), password);
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async register({ email, password, name }: RegisterInput): Promise<{ uid: string }> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
      await updateProfile(credential.user, { displayName: name });
      return { uid: credential.user.uid };
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email.trim());
    } catch (error) {
      // Do not reveal whether an address is registered.
      const code = (error as { code?: string }).code;
      if (code !== "auth/user-not-found") throw mapAuthError(error);
    }
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = this.auth.currentUser;
    return user ? user.getIdToken(forceRefresh) : null;
  }
}
