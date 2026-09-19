/**
 * Role-based access control.
 *
 * This matrix is the single source of truth in TypeScript. `firestore.rules`
 * contains an identical map (`capabilitiesFor`) that actually enforces it on the
 * server; a unit test (`permissions.test.ts`) fails if the two ever drift apart.
 * UI code uses `can()` only to decide what to *show*, never as a security check.
 */

import type { AccessClaims, StaffRole } from "@/types";

export const CAPABILITIES = [
  "announcements",
  "events",
  "societies",
  "calendar",
  "jobs",
  "faqs",
  "services",
  "staffDirectory",
  "facilityIssues",
  "bookings",
  "rooms",
  "academicSupport",
  "lostFoundModeration",
  "notifications",
  "feedback",
  "users",
  "knowledge",
  "analytics",
  "settings",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/** What each staff group may manage. Administrators may manage everything. */
export const STAFF_CAPABILITIES: Record<StaffRole, readonly Capability[]> = {
  academic: ["announcements", "events", "calendar", "jobs", "faqs", "academicSupport", "notifications"],
  society: ["events", "societies", "notifications"],
  facilities: [
    "announcements",
    "facilityIssues",
    "bookings",
    "rooms",
    "services",
    "lostFoundModeration",
    "notifications",
  ],
  finance: ["announcements", "faqs", "services", "notifications"],
  it: ["announcements", "faqs", "services", "facilityIssues", "notifications"],
};

type AccessLike = Pick<AccessClaims, "role" | "staffRole"> | null | undefined;

export function capabilitiesOf(access: AccessLike): readonly Capability[] {
  if (!access) return [];
  if (access.role === "admin") return CAPABILITIES;
  if (access.role === "staff" && access.staffRole) return STAFF_CAPABILITIES[access.staffRole];
  return [];
}

export function can(access: AccessLike, capability: Capability): boolean {
  return capabilitiesOf(access).includes(capability);
}

export function isStaffOrAdmin(access: AccessLike): boolean {
  return access?.role === "staff" || access?.role === "admin";
}

export function isAdmin(access: AccessLike): boolean {
  return access?.role === "admin";
}

/** Society representatives may only manage their own society (and its events). */
export function canManageSociety(access: (AccessLike & { societyId?: string | null }) | null | undefined, societyId: string): boolean {
  if (!access) return false;
  if (access.role === "admin") return true;
  return access.role === "staff" && access.staffRole === "society" && access.societyId === societyId;
}

export function canManageEvent(
  access: (AccessLike & { societyId?: string | null }) | null | undefined,
  event: { societyId: string | null },
): boolean {
  if (!can(access, "events")) return false;
  if (access?.role === "staff" && access.staffRole === "society") {
    return event.societyId !== null && event.societyId === access.societyId;
  }
  return true;
}
