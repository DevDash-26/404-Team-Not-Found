/** Users, roles and the access claims attached to an authenticated session. */

export const ROLES = ["student", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Staff members belong to one functional group that decides which areas of the
 * platform they may manage. Administrators are a separate top-level role.
 */
export const STAFF_ROLES = ["academic", "society", "facilities", "finance", "it"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  academic: "Academic Staff",
  society: "Society Representative",
  facilities: "Facilities Staff",
  finance: "Finance Staff",
  it: "IT Staff",
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  staffRole: StaffRole | null;
  /** Student registration number, students only. */
  studentId: string | null;
  faculty: string | null;
  programme: string | null;
  year: number | null;
  /** For society representatives: the one society they may manage. */
  societyId: string | null;
  department: string | null;
  createdAt: string;
}

/** The parts of a profile that authorisation decisions depend on. */
export interface AccessClaims {
  role: Role;
  staffRole: StaffRole | null;
  societyId: string | null;
}

/** Minimal identity of the person performing an action (denormalised into documents). */
export interface ActorRef {
  id: string;
  name: string;
}
