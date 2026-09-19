import type { Job, JobType } from "@/types";
import { daysUntil, endOfDay, parseDateKey } from "@/utils/dates";
import { matchesQuery } from "@/utils/text";

export interface JobFilters {
  query: string;
  type: JobType | "all";
  location: string;
  skill: string;
  /** Hide listings whose deadline has passed. */
  openOnly: boolean;
}

export const DEFAULT_JOB_FILTERS: JobFilters = { query: "", type: "all", location: "", skill: "", openOnly: true };

/** A job is open until the end of its deadline day. */
export function isJobOpen(job: Pick<Job, "deadline">, now: Date): boolean {
  const deadline = parseDateKey(job.deadline);
  return deadline ? endOfDay(deadline).getTime() >= now.getTime() : false;
}

export function daysLeft(job: Pick<Job, "deadline">, now: Date): number {
  const deadline = parseDateKey(job.deadline);
  return deadline ? daysUntil(deadline, now) : Number.NaN;
}

export function filterJobs(jobs: Job[], filters: JobFilters, now: Date): Job[] {
  return jobs.filter((job) => {
    if (filters.openOnly && !isJobOpen(job, now)) return false;
    if (filters.type !== "all" && job.type !== filters.type) return false;
    if (filters.location && !matchesQuery([job.location], filters.location)) return false;
    if (filters.skill && !matchesQuery(job.skills, filters.skill)) return false;
    return matchesQuery([job.company, job.position, job.description, job.location, job.type, ...job.skills], filters.query);
  });
}

/** Open jobs by soonest deadline first, then closed jobs by most recent deadline. */
export function sortJobs(jobs: Job[], now: Date): Job[] {
  return [...jobs].sort((a, b) => {
    const aOpen = isJobOpen(a, now);
    const bOpen = isJobOpen(b, now);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return aOpen ? a.deadline.localeCompare(b.deadline) : b.deadline.localeCompare(a.deadline);
  });
}

/** Distinct skills across listings, for the skill filter suggestions. */
export function allSkills(jobs: Job[]): string[] {
  return Array.from(new Set(jobs.flatMap((job) => job.skills))).sort((a, b) => a.localeCompare(b));
}
