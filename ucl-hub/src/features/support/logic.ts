import type { SupportRequest, SupportStatus } from "@/types";
import { matchesQuery } from "@/utils/text";

const NEXT: Record<SupportStatus, SupportStatus[]> = {
  open: ["matched", "closed"],
  matched: ["closed", "open"],
  closed: ["open"],
};

export function nextSupportStatuses(status: SupportStatus): SupportStatus[] {
  return NEXT[status];
}

export function canTransitionSupport(from: SupportStatus, to: SupportStatus): boolean {
  return from === to || NEXT[from].includes(to);
}

export interface SupportFilters {
  query: string;
  status: SupportStatus | "all";
}

export function filterSupport(items: SupportRequest[], filters: SupportFilters): SupportRequest[] {
  return items.filter((item) => {
    if (filters.status !== "all" && item.status !== filters.status) return false;
    return matchesQuery([item.subject, item.description, item.requester.name, item.type], filters.query);
  });
}
