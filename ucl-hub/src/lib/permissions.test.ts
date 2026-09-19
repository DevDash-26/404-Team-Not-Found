import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { STAFF_ROLES, type StaffRole } from "@/types";
import { parseClaims, toCustomClaims } from "./backend/claims";
import { CAPABILITIES, STAFF_CAPABILITIES, can, canManageEvent, canManageSociety, capabilitiesOf, isAdmin, isStaffOrAdmin, type Capability } from "./permissions";

describe("role-based access control", () => {
  it("gives students no management capabilities at all", () => {
    for (const capability of CAPABILITIES) {
      expect(can({ role: "student", staffRole: null }, capability)).toBe(false);
    }
  });

  it("gives administrators every capability", () => {
    expect(capabilitiesOf({ role: "admin", staffRole: null })).toEqual(CAPABILITIES);
  });

  it("limits each staff group to its own areas", () => {
    expect(can({ role: "staff", staffRole: "facilities" }, "bookings")).toBe(true);
    expect(can({ role: "staff", staffRole: "facilities" }, "jobs")).toBe(false);
    expect(can({ role: "staff", staffRole: "finance" }, "announcements")).toBe(true);
    expect(can({ role: "staff", staffRole: "finance" }, "facilityIssues")).toBe(false);
    expect(can({ role: "staff", staffRole: "it" }, "facilityIssues")).toBe(true);
    expect(can({ role: "staff", staffRole: "academic" }, "academicSupport")).toBe(true);
    expect(can({ role: "staff", staffRole: "society" }, "announcements")).toBe(false);
  });

  it("keeps administration-only areas away from every staff group", () => {
    const adminOnly: Capability[] = ["users", "knowledge", "analytics", "settings", "feedback", "staffDirectory"];
    for (const staffRole of STAFF_ROLES) {
      for (const capability of adminOnly) {
        expect(can({ role: "staff", staffRole }, capability), `${staffRole} must not have ${capability}`).toBe(false);
      }
    }
  });

  it("treats staff without a group, missing access and unknown values as having nothing", () => {
    expect(capabilitiesOf({ role: "staff", staffRole: null })).toEqual([]);
    expect(capabilitiesOf(null)).toEqual([]);
    expect(capabilitiesOf(undefined)).toEqual([]);
  });

  it("identifies staff and administrators", () => {
    expect(isStaffOrAdmin({ role: "student", staffRole: null })).toBe(false);
    expect(isStaffOrAdmin({ role: "staff", staffRole: "it" })).toBe(true);
    expect(isAdmin({ role: "staff", staffRole: "it" })).toBe(false);
    expect(isAdmin({ role: "admin", staffRole: null })).toBe(true);
  });
});

describe("society representatives", () => {
  const rep = { role: "staff" as const, staffRole: "society" as const, societyId: "soc-computing" };

  it("can manage only their own society", () => {
    expect(canManageSociety(rep, "soc-computing")).toBe(true);
    expect(canManageSociety(rep, "soc-drama")).toBe(false);
  });

  it("can manage events only for their own society, never general campus events", () => {
    expect(canManageEvent(rep, { societyId: "soc-computing" })).toBe(true);
    expect(canManageEvent(rep, { societyId: "soc-drama" })).toBe(false);
    expect(canManageEvent(rep, { societyId: null })).toBe(false);
  });

  it("lets administrators and academic staff manage any event", () => {
    expect(canManageEvent({ role: "admin", staffRole: null }, { societyId: "soc-drama" })).toBe(true);
    expect(canManageEvent({ role: "staff", staffRole: "academic" }, { societyId: null })).toBe(true);
  });

  it("denies students and signed-out visitors", () => {
    expect(canManageEvent({ role: "student", staffRole: null }, { societyId: "soc-computing" })).toBe(false);
    expect(canManageSociety(null, "soc-computing")).toBe(false);
  });
});

describe("token claims", () => {
  it("defaults to the least-privileged role when claims are missing or malformed", () => {
    expect(parseClaims(null)).toEqual({ role: "student", staffRole: null, societyId: null });
    expect(parseClaims({ role: "superuser" })).toEqual({ role: "student", staffRole: null, societyId: null });
    expect(parseClaims({ role: 42, staffRole: "facilities" })).toEqual({ role: "student", staffRole: null, societyId: null });
  });

  it("ignores a staff group or society that does not belong to the role", () => {
    expect(parseClaims({ role: "student", staffRole: "facilities", societyId: "x" })).toEqual({ role: "student", staffRole: null, societyId: null });
    expect(parseClaims({ role: "staff", staffRole: "finance", societyId: "soc-computing" }).societyId).toBeNull();
    expect(parseClaims({ role: "staff", staffRole: "wizard" }).staffRole).toBeNull();
  });

  it("round-trips valid claims", () => {
    const access = { role: "staff" as const, staffRole: "society" as const, societyId: "soc-computing" };
    expect(parseClaims(toCustomClaims(access))).toEqual(access);
  });
});

/**
 * The browser-side matrix (STAFF_CAPABILITIES) only decides what to show. The
 * rules in firestore.rules decide what is allowed. If the two ever disagree,
 * people would see buttons that fail, or be blocked from work they should do.
 */
describe("firestore.rules stays in sync with STAFF_CAPABILITIES", () => {
  const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8");
  const block = /BEGIN capabilities[\s\S]*?END capabilities/.exec(rules)?.[0] ?? "";

  function parseRulesMatrix(): Record<string, string[]> {
    const matrix: Record<string, string[]> = {};
    for (const match of block.matchAll(/'([a-z]+)'\s*:\s*\[([^\]]*)\]/g)) {
      const [, group, list] = match;
      if (!group || list === undefined) continue;
      matrix[group] = [...list.matchAll(/'([A-Za-z]+)'/g)].map((m) => m[1] ?? "");
    }
    return matrix;
  }

  it("finds the capability block in the rules file", () => {
    expect(block.length).toBeGreaterThan(0);
  });

  it("lists exactly the same staff groups", () => {
    expect(Object.keys(parseRulesMatrix()).sort()).toEqual([...STAFF_ROLES].sort());
  });

  it.each(STAFF_ROLES)("grants %s the same capabilities in both places", (group: StaffRole) => {
    const inRules = [...(parseRulesMatrix()[group] ?? [])].sort();
    const inCode = [...STAFF_CAPABILITIES[group]].sort();
    expect(inRules).toEqual(inCode);
  });

  it("only mentions capabilities that exist", () => {
    for (const list of Object.values(parseRulesMatrix())) {
      for (const capability of list) expect(CAPABILITIES).toContain(capability);
    }
  });
});
