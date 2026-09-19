/**
 * Audience targeting shared by announcements, notifications and the academic
 * calendar. An empty list for a dimension means "everyone" on that dimension.
 */

import { facultyById } from "@/config/academics";
import type { Audience, UserProfile } from "@/types";

export interface TargetProfile {
  faculty: string | null;
  programme: string | null;
  year: number | null;
}

export function targetOf(profile: Pick<UserProfile, "faculty" | "programme" | "year"> | null | undefined): TargetProfile | null {
  if (!profile) return null;
  return { faculty: profile.faculty, programme: profile.programme, year: profile.year };
}

export function isEveryone(audience: Audience): boolean {
  return audience.faculties.length === 0 && audience.programmes.length === 0 && audience.years.length === 0;
}

/**
 * True when content aimed at `audience` is relevant to `target`.
 * A `null` target (staff and administrators) sees everything.
 */
export function matchesAudience(audience: Audience | undefined, target: TargetProfile | null): boolean {
  if (!target || !audience) return true;
  const facultyOk = audience.faculties.length === 0 || (target.faculty !== null && audience.faculties.includes(target.faculty));
  const programmeOk =
    audience.programmes.length === 0 || (target.programme !== null && audience.programmes.includes(target.programme));
  const yearOk = audience.years.length === 0 || (target.year !== null && audience.years.includes(target.year));
  return facultyOk && programmeOk && yearOk;
}

/** Human readable description, e.g. "Computing · Software Engineering · Year 2". */
export function describeAudience(audience: Audience | undefined): string {
  if (!audience || isEveryone(audience)) return "All students";
  const parts: string[] = [];
  if (audience.faculties.length) parts.push(audience.faculties.map((id) => facultyById(id)?.name ?? id).join(", "));
  if (audience.programmes.length) parts.push(audience.programmes.join(", "));
  if (audience.years.length) parts.push(audience.years.map((y) => `Year ${y}`).join(", "));
  return parts.join(" · ");
}
