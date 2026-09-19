"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import type { ProfileInput, RegistrationInput } from "@/features/users/schema";
import { parseClaims } from "@/lib/backend/claims";
import type { SessionUser } from "@/lib/backend/types";
import { can as hasCapability, type Capability } from "@/lib/permissions";
import type { AccessClaims, UserProfile } from "@/types";
import { AppError } from "@/utils/errors";

type Session =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: SessionUser; profile: UserProfile };

export interface AuthValue {
  status: Session["status"];
  user: SessionUser | null;
  profile: UserProfile | null;
  /**
   * Role information from the verified session token. This (not the profile
   * document) drives what the UI shows; the server rules re-check it on every
   * request, so the UI is only a convenience.
   */
  access: AccessClaims | null;
  can: (capability: Capability) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: RegistrationInput) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Used only if the profile cannot be loaded (for example offline on first sign-in): keeps the app usable. */
function fallbackProfile(user: SessionUser): UserProfile {
  return {
    id: user.uid,
    name: user.name || user.email.split("@")[0] || "Student",
    email: user.email,
    role: user.claims.role,
    staffRole: user.claims.staffRole,
    studentId: null,
    faculty: null,
    programme: null,
    year: null,
    societyId: user.claims.societyId,
    department: null,
    createdAt: new Date(0).toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth, users } = useServices();
  const [session, setSession] = useState<Session>({ status: "loading" });
  const registering = useRef(false);
  const latest = useRef(0);

  const resolveProfile = useCallback(
    async (user: SessionUser): Promise<UserProfile> => {
      try {
        return (await users.get(user.uid)) ?? (await users.ensureProfile(user.uid, user.email, user.name));
      } catch {
        return fallbackProfile(user);
      }
    },
    [users],
  );

  useEffect(() => {
    return auth.onChange((user) => {
      const ticket = ++latest.current;
      if (!user) {
        setSession({ status: "signed-out" });
        return;
      }
      // While registering, `register()` creates the profile and completes the sign-in itself.
      if (registering.current) return;
      void resolveProfile(user).then((profile) => {
        if (ticket === latest.current) setSession({ status: "signed-in", user, profile });
      });
    });
  }, [auth, resolveProfile]);

  const signIn = useCallback((email: string, password: string) => auth.signIn(email, password), [auth]);
  const signOut = useCallback(() => auth.signOut(), [auth]);
  const sendPasswordReset = useCallback((email: string) => auth.sendPasswordReset(email), [auth]);

  const register = useCallback(
    async (input: RegistrationInput) => {
      registering.current = true;
      const user: SessionUser = { uid: "", email: input.email, name: input.name, claims: parseClaims(null) };
      try {
        const { uid } = await auth.register({ email: input.email, password: input.password, name: input.name });
        user.uid = uid;
        try {
          const profile = await users.createStudentProfile(uid, input.email, input);
          latest.current += 1;
          setSession({ status: "signed-in", user, profile });
        } catch (error) {
          // The account exists but its profile could not be saved: sign in with a minimal profile the student can complete later.
          registering.current = false;
          latest.current += 1;
          setSession({ status: "signed-in", user, profile: await resolveProfile(user) });
          throw new AppError("unavailable", "Your account was created, but we couldn't save your academic details. Please add them from your profile.", { cause: error });
        }
      } finally {
        registering.current = false;
      }
    },
    [auth, users, resolveProfile],
  );

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      if (session.status !== "signed-in") throw new AppError("unauthenticated", "Please sign in to continue.");
      await users.updateOwnProfile(session.user.uid, input);
      const fresh = await users.get(session.user.uid);
      setSession((current) => (current.status === "signed-in" && fresh ? { ...current, profile: fresh } : current));
    },
    [session, users],
  );

  const value = useMemo<AuthValue>(() => {
    const signedIn = session.status === "signed-in";
    const access = signedIn ? session.user.claims : null;
    return {
      status: session.status,
      user: signedIn ? session.user : null,
      profile: signedIn ? session.profile : null,
      access,
      can: (capability) => hasCapability(access, capability),
      signIn,
      register,
      signOut,
      sendPasswordReset,
      updateProfile,
    };
  }, [session, signIn, register, signOut, sendPasswordReset, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

/** For pages behind the auth gate: the signed-in user and profile are guaranteed. */
export function useCurrentUser(): { user: SessionUser; profile: UserProfile; access: AccessClaims } {
  const { user, profile, access } = useAuth();
  if (!user || !profile || !access) throw new Error("useCurrentUser must be used on a page behind <AuthGate>.");
  return { user, profile, access };
}
