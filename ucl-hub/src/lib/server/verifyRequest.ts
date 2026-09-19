/**
 * Authenticates API requests from the Firebase ID token in the Authorization
 * header. Roles come from the verified token's custom claims, which only the
 * server can set, never from anything the browser sends in the body.
 */

import "server-only";
import { parseClaims } from "@/lib/backend/claims";
import type { AccessClaims } from "@/types";
import { AppError } from "@/utils/errors";
import { getAdminAuth } from "./firebaseAdmin";

export interface VerifiedCaller {
  uid: string;
  email: string;
  name: string;
  claims: AccessClaims;
}

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match?.[1]) throw new AppError("unauthenticated", "Please sign in to continue.");
  return match[1];
}

export async function verifyCaller(request: Request, options: { checkRevoked?: boolean } = {}): Promise<VerifiedCaller> {
  const token = bearerToken(request);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token, options.checkRevoked ?? false);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: typeof decoded.name === "string" ? decoded.name : "",
      claims: parseClaims(decoded as unknown as Record<string, unknown>),
    };
  } catch {
    throw new AppError("unauthenticated", "Your session has expired. Please sign in again.");
  }
}

export async function requireAdmin(request: Request): Promise<VerifiedCaller> {
  // Admin actions re-check revocation so a demoted administrator loses access immediately.
  const caller = await verifyCaller(request, { checkRevoked: true });
  if (caller.claims.role !== "admin") throw new AppError("permission-denied", "Only administrators can do that.");
  return caller;
}
