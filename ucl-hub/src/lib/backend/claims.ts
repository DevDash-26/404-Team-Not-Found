import type { AccessClaims, Role, StaffRole } from "@/types";
import { ROLES, STAFF_ROLES } from "@/types";

/**
 * Converts raw (untrusted) token claims into typed access claims.
 * Anything missing or malformed falls back to the least-privileged student role.
 */
export function parseClaims(raw: Record<string, unknown> | null | undefined): AccessClaims {
  const role = ROLES.includes(raw?.role as Role) ? (raw?.role as Role) : "student";
  const staffRole =
    role === "staff" && STAFF_ROLES.includes(raw?.staffRole as StaffRole) ? (raw?.staffRole as StaffRole) : null;
  const societyId = typeof raw?.societyId === "string" && raw.societyId ? raw.societyId : null;
  return { role, staffRole, societyId: role === "staff" && staffRole === "society" ? societyId : null };
}

/** Claim payload written to a Firebase custom token for a given access level. */
export function toCustomClaims(access: AccessClaims): Record<string, string> {
  const claims: Record<string, string> = { role: access.role };
  if (access.role === "staff" && access.staffRole) claims.staffRole = access.staffRole;
  if (access.role === "staff" && access.staffRole === "society" && access.societyId) {
    claims.societyId = access.societyId;
  }
  return claims;
}
