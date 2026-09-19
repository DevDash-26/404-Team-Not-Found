import type { CampusService, ServiceCategory, StaffContact } from "@/types";
import { matchesQuery } from "@/utils/text";

export function filterServices(items: CampusService[], query: string, category: ServiceCategory | "all"): CampusService[] {
  return items.filter((service) => {
    if (category !== "all" && service.category !== category) return false;
    return matchesQuery(
      [service.name, service.description, service.location, service.category, ...service.openingHours.map((h) => h.days)],
      query,
    );
  });
}

export function filterStaff(items: StaffContact[], query: string, department: string): StaffContact[] {
  return items.filter((contact) => {
    if (department !== "all" && contact.department !== department) return false;
    return matchesQuery([contact.name, contact.title, contact.department, contact.office, ...contact.topics], query);
  });
}

export function departments(items: StaffContact[]): string[] {
  return Array.from(new Set(items.map((c) => c.department))).sort((a, b) => a.localeCompare(b));
}

/** "Mon–Fri 8:00 AM to 8:00 PM; Sat ..." for compact display and for the assistant. */
export function summariseHours(service: Pick<CampusService, "openingHours">): string {
  return service.openingHours.map((line) => `${line.days}: ${line.hours}`).join("; ");
}

/** Categories shown on dedicated pages (Library, IT Support, Wellbeing). */
export const CATEGORY_PAGES = {
  library: "library",
  "it-support": "it",
  wellbeing: "wellbeing",
} as const satisfies Record<string, ServiceCategory>;
