import { toCustomClaims } from "@/lib/backend/claims";
import { COLLECTIONS } from "@/lib/backend/collections";
import { accessUpdateSchema } from "@/features/users/schema";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebaseAdmin";
import { errorResponse, json, parseBody } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/verifyRequest";
import { AppError } from "@/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ uid: string }>;
}

/** Changes a user's role. Administrators only, and never their own (so the last admin cannot be locked out). */
export async function PATCH(request: Request, { params }: RouteContext): Promise<Response> {
  try {
    const caller = await requireAdmin(request);
    const { uid } = await params;
    if (uid === caller.uid) throw new AppError("validation", "You can't change your own access. Ask another administrator.");

    const update = await parseBody(request, accessUpdateSchema);
    const access = {
      role: update.role,
      staffRole: update.role === "staff" ? update.staffRole : null,
      societyId: update.role === "staff" && update.staffRole === "society" ? update.societyId : null,
    };

    const auth = getAdminAuth();
    try {
      await auth.getUser(uid);
    } catch {
      throw new AppError("not-found", "That user no longer exists.");
    }
    await auth.setCustomUserClaims(uid, toCustomClaims(access));
    // Existing sessions must pick up the new claims, so old refresh tokens are revoked.
    await auth.revokeRefreshTokens(uid);
    await getAdminDb().doc(`${COLLECTIONS.users}/${uid}`).set(access, { merge: true });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
