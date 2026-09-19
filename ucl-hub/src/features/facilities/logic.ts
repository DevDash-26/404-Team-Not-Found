/** Facility issue workflow and filtering. Pure functions. */

import type { FacilityCategory, FacilityIssue, FacilityPriority, FacilityStatus, StaffRole } from "@/types";
import { matchesQuery } from "@/utils/text";

/** Issues move forward one step at a time; only assigned/in-progress work can be resolved. */
export const FACILITY_TRANSITIONS: Record<FacilityStatus, FacilityStatus[]> = {
  submitted: ["assigned"],
  assigned: ["in-progress", "resolved"],
  "in-progress": ["resolved"],
  resolved: [],
};

export function nextFacilityStatuses(status: FacilityStatus): FacilityStatus[] {
  return FACILITY_TRANSITIONS[status];
}

export function canTransitionFacility(from: FacilityStatus, to: FacilityStatus): boolean {
  return FACILITY_TRANSITIONS[from].includes(to);
}

export function isOpenIssue(issue: Pick<FacilityIssue, "status">): boolean {
  return issue.status !== "resolved";
}

export type ResponsibleTeam = "facilities" | "it";

const IT_CATEGORIES: readonly FacilityCategory[] = ["internet", "equipment"];

/** Which staff team normally handles a report of this category. */
export function teamForCategory(category: FacilityCategory): ResponsibleTeam {
  return IT_CATEGORIES.includes(category) ? "it" : "facilities";
}

/** Issues a staff member is expected to see. Administrators and unknown roles see all. */
export function issuesForTeam(items: FacilityIssue[], staffRole: StaffRole | null): FacilityIssue[] {
  if (staffRole !== "facilities" && staffRole !== "it") return items;
  return items.filter((issue) => teamForCategory(issue.category) === staffRole);
}

const PRIORITY_RANK: Record<FacilityPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

/** Open issues first, most urgent first, then oldest first (so nothing waits forever). */
export function sortIssues(items: FacilityIssue[]): FacilityIssue[] {
  return [...items].sort((a, b) => {
    const openDiff = Number(!isOpenIssue(a)) - Number(!isOpenIssue(b));
    if (openDiff !== 0) return openDiff;
    const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export interface FacilityFilters {
  query: string;
  status: FacilityStatus | "all";
  priority: FacilityPriority | "all";
  category: FacilityCategory | "all";
}

export const DEFAULT_FACILITY_FILTERS: FacilityFilters = { query: "", status: "all", priority: "all", category: "all" };

export function filterIssues(items: FacilityIssue[], filters: FacilityFilters): FacilityIssue[] {
  return items.filter((issue) => {
    if (filters.status !== "all" && issue.status !== filters.status) return false;
    if (filters.priority !== "all" && issue.priority !== filters.priority) return false;
    if (filters.category !== "all" && issue.category !== filters.category) return false;
    return matchesQuery([issue.description, issue.location, issue.category, issue.reporter.name], filters.query);
  });
}
