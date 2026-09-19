import { describe, expect, it } from "vitest";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import { EVERYONE, type CalendarEntry } from "@/types";
import { validate } from "@/lib/validation";
import { targetOf } from "@/lib/audience";
import { buildMonthGrid, coversDay, entriesForProfile, entriesForSelection, entriesOnDay, filterByType, gridRange, monthKey, shiftMonth, upcomingEntries } from "./logic";
import { calendarEntrySchema } from "./schema";
import { createCalendarService } from "./service";

const entry = (over: Partial<CalendarEntry>): CalendarEntry => ({
  id: "e",
  title: "Entry",
  type: "other",
  startDate: "2026-09-20",
  endDate: "2026-09-20",
  description: "",
  audience: EVERYONE,
  ...over,
});

describe("academic calendar filtering by programme and year", () => {
  const entries = [
    entry({ id: "all", title: "Semester starts" }),
    entry({ id: "se2", audience: { faculties: ["computing"], programmes: ["Software Engineering"], years: [2] } }),
    entry({ id: "comp", audience: { faculties: ["computing"], programmes: [], years: [] } }),
    entry({ id: "biz", audience: { faculties: ["business"], programmes: [], years: [] } }),
    entry({ id: "y3", audience: { faculties: [], programmes: [], years: [3] } }),
  ];

  it("shows a student everything for them plus everything aimed at everyone", () => {
    const ids = entriesForProfile(entries, targetOf({ faculty: "computing", programme: "Software Engineering", year: 2 })).map((e) => e.id);
    expect(ids).toEqual(["all", "se2", "comp"]);
  });

  it("lets anyone pick a faculty, programme and year to preview", () => {
    expect(entriesForSelection(entries, { faculty: "", programme: "", year: null })).toHaveLength(5);
    expect(entriesForSelection(entries, { faculty: "business", programme: "", year: null }).map((e) => e.id)).toEqual(["all", "biz", "y3"]);
    expect(entriesForSelection(entries, { faculty: "computing", programme: "Software Engineering", year: 3 }).map((e) => e.id)).toEqual(["all", "comp", "y3"]);
  });

  it("shows staff everything", () => {
    expect(entriesForProfile(entries, null)).toHaveLength(5);
  });

  it("filters by entry type", () => {
    const typed = [entry({ id: "a", type: "exam" }), entry({ id: "b", type: "holiday" })];
    expect(filterByType(typed, "exam").map((e) => e.id)).toEqual(["a"]);
    expect(filterByType(typed, "all")).toHaveLength(2);
  });
});

describe("calendar dates", () => {
  it("covers every day of a multi-day entry, inclusive", () => {
    const exam = entry({ startDate: "2026-11-02", endDate: "2026-11-06" });
    expect(coversDay(exam, "2026-11-02")).toBe(true);
    expect(coversDay(exam, "2026-11-06")).toBe(true);
    expect(coversDay(exam, "2026-11-07")).toBe(false);
    expect(entriesOnDay([exam, entry({ id: "z" })], "2026-11-04")).toEqual([exam]);
  });

  it("lists upcoming entries in date order, including ones already under way", () => {
    const list = [
      entry({ id: "later", startDate: "2026-10-30", endDate: "2026-10-30" }),
      entry({ id: "past", startDate: "2026-09-01", endDate: "2026-09-02" }),
      entry({ id: "now", startDate: "2026-09-14", endDate: "2026-09-18" }),
    ];
    expect(upcomingEntries(list, TEST_NOW).map((e) => e.id)).toEqual(["now", "later"]);
    expect(upcomingEntries(list, TEST_NOW, 7).map((e) => e.id)).toEqual(["now"]);
  });

  it("builds a six-week Monday-first grid that contains the whole month", () => {
    const grid = buildMonthGrid(new Date(2026, 8, 1), TEST_NOW);
    expect(grid).toHaveLength(42);
    expect(new Date(`${grid[0]?.dateKey}T00:00:00`).getDay()).toBe(1);
    expect(grid.filter((d) => d.inMonth)).toHaveLength(30);
    expect(grid.filter((d) => d.isToday).map((d) => d.dateKey)).toEqual(["2026-09-16"]);
  });

  it("navigates between months, across year boundaries", () => {
    expect(monthKey(shiftMonth(new Date(2026, 11, 15), 1))).toBe("2027-01");
    expect(monthKey(shiftMonth(new Date(2026, 0, 15), -1))).toBe("2025-12");
    const range = gridRange(new Date(2026, 8, 1));
    expect(range.from <= "2026-09-01" && range.to >= "2026-09-30").toBe(true);
  });
});

describe("calendar service and form", () => {
  it("returns only entries overlapping the requested range, sorted", async () => {
    const world = createTestWorld();
    const service = createCalendarService(world.store);
    const range = await service.listRange("2026-09-01", "2026-12-31");
    expect(range.length).toBeGreaterThan(0);
    expect(range.every((e) => e.endDate >= "2026-09-01" && e.startDate <= "2026-12-31")).toBe(true);
    const sorted = [...range].sort((a, b) => a.startDate.localeCompare(b.startDate));
    expect(range.map((e) => e.id)).toEqual(sorted.map((e) => e.id));
  });

  it("rejects an end date before the start date and impossible dates", () => {
    const valid = { title: "Mid-semester exams", type: "exam", startDate: "2026-11-02", endDate: "2026-11-06", description: "", audience: EVERYONE };
    expect(validate(calendarEntrySchema, valid).ok).toBe(true);
    const backwards = validate(calendarEntrySchema, { ...valid, endDate: "2026-11-01" });
    expect(backwards.ok).toBe(false);
    if (!backwards.ok) expect(backwards.errors.endDate).toMatch(/before/i);
    expect(validate(calendarEntrySchema, { ...valid, startDate: "2026-02-30" }).ok).toBe(false);
  });
});
