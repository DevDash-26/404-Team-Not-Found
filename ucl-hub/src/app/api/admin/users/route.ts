import { toCustomClaims } from "@/lib/backend/claims";
import { COLLECTIONS } from "@/lib/backend/collections";
import { createUserRequestSchema } from "@/features/users/schema";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebaseAdmin";
import { errorResponse, json, parseBody } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/verifyRequest";
import type { UserProfile } from "@/types";
import { AppError } from "@/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Creates an account with its role claims and profile. Administrators only. */
export async function POST(request: Request): Promise<Response> {
  try {
    await requireAdmin(request);
    const input = await parseBody(request, createUserRequestSchema);
    const auth = getAdminAuth();

    let uid: string;
    try {
      const created = await auth.createUser({ email: input.email, password: input.password, displayName: input.name });
      uid = created.uid;
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "auth/email-already-exists") throw new AppError("already-exists", "An account with that email already exists.");
      throw error;
    }

    const access = {
      role: input.role,
      staffRole: input.role === "staff" ? input.staffRole : null,
      societyId: input.role === "staff" && input.staffRole === "society" ? input.societyId : null,
    };
    await auth.setCustomUserClaims(uid, toCustomClaims(access));

    const profile: Omit<UserProfile, "id"> = {
      name: input.name,
      email: input.email,
      role: access.role,
      staffRole: access.staffRole,
      studentId: null,
      faculty: null,
      programme: null,
      year: null,
      societyId: access.societyId,
      department: input.department || null,
      createdAt: new Date().toISOString(),
    };
    await getAdminDb().doc(`${COLLECTIONS.users}/${uid}`).set(profile);
    return json({ uid }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
