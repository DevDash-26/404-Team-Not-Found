import type { AccessClaims } from "@/types";
import { isStaffOrAdmin } from "@/lib/permissions";

/** Where a user lands after signing in. */
export function homeFor(access: AccessClaims | null): string {
  return isStaffOrAdmin(access) ? "/admin" : "/dashboard";
}

/**
 * Accepts a `?next=` value only if it is a local path. This blocks open
 * redirects such as `?next=https://evil.example` or `?next=//evil.example`.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}
