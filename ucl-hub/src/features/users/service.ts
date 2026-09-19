import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { AccessUpdate, AdminGateway, DataStore, Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import type { UserProfile } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { NewUserInput, ProfileInput } from "./schema";

export function createUserService(store: DataStore, admin: AdminGateway, clock: Clock = systemClock) {
  const crud = createCrudService<UserProfile>(store, COLLECTIONS.users);

  return {
    get: crud.get,

    /** Creates the profile of a freshly registered student. Role is always "student". */
    async createStudentProfile(uid: string, email: string, input: ProfileInput): Promise<UserProfile> {
      const profile: Omit<UserProfile, "id"> = {
        name: input.name,
        email,
        role: "student",
        staffRole: null,
        studentId: input.studentId,
        faculty: input.faculty,
        programme: input.programme,
        year: input.year,
        societyId: null,
        department: null,
        createdAt: clock.now().toISOString(),
      };
      await store.commit([{ kind: "create", path: `${COLLECTIONS.users}/${uid}`, data: profile as unknown as Record<string, unknown> }]);
      return { id: uid, ...profile };
    },

    /** Safety net: an authenticated user with no profile document gets a minimal student profile. */
    async ensureProfile(uid: string, email: string, name: string): Promise<UserProfile> {
      const existing = await crud.get(uid);
      if (existing) return existing;
      const profile: Omit<UserProfile, "id"> = {
        name: name || email.split("@")[0] || "Student",
        email,
        role: "student",
        staffRole: null,
        studentId: null,
        faculty: null,
        programme: null,
        year: null,
        societyId: null,
        department: null,
        createdAt: clock.now().toISOString(),
      };
      await store.commit([{ kind: "create", path: `${COLLECTIONS.users}/${uid}`, data: profile as unknown as Record<string, unknown> }]);
      return { id: uid, ...profile };
    },

    /** Users edit their own academic details (never their role). */
    updateOwnProfile: (uid: string, input: ProfileInput) =>
      crud.update(uid, {
        name: input.name,
        studentId: input.studentId,
        faculty: input.faculty,
        programme: input.programme,
        year: input.year,
      }),

    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<UserProfile>> {
      return crud.list({ orderBy: [{ field: "name" }], limit: pageSize, after: cursor });
    },

    /** Server-side operations: these go through the admin gateway, never straight to Firestore. */
    createAccount: (input: NewUserInput) =>
      admin.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
        staffRole: input.role === "staff" ? input.staffRole : null,
        societyId: input.role === "staff" && input.staffRole === "society" ? input.societyId : null,
        department: input.department || null,
      }),

    updateAccess: (uid: string, update: AccessUpdate) => admin.updateAccess(uid, update),
  };
}

export type UserService = ReturnType<typeof createUserService>;
