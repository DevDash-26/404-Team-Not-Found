import { describe, expect, it } from "vitest";
import { createTestWorld } from "@/test/helpers";
import type { FacilityIssue } from "@/types";
import { AppError } from "@/utils/errors";
import { canTransitionFacility, filterIssues, isOpenIssue, issuesForTeam, nextFacilityStatuses, sortIssues, teamForCategory } from "./logic";
import { facilityIssueSchema, type FacilityIssueInput } from "./schema";
import { createFacilityService } from "./service";

const student = { id: "u-student1", name: "Amaya" };
const facilities = { id: "u-facilities", name: "Nuwan (Facilities)" };

const report: FacilityIssueInput = {
  category: "air-conditioning",
  location: "Block A, room A102",
  description: "The air conditioner is leaking water onto the front row.",
  priority: "high",
  imageUrl: null,
  imagePath: null,
};

async function setup() {
  const world = createTestWorld();
  const service = createFacilityService(world.store, world.clock);
  const id = await service.create(report, student);
  const load = async () => (await world.store.get<FacilityIssue>(`facilityIssues/${id}`))!;
  return { world, service, id, load };
}

describe("facility issue workflow", () => {
  it("starts as submitted with a first history entry", async () => {
    const { load } = await setup();
    const issue = await load();
    expect(issue.status).toBe("submitted");
    expect(issue.assignedTo).toBeNull();
    expect(issue.updates).toHaveLength(1);
    expect(issue.updates[0]).toMatchObject({ status: "submitted", by: "Amaya" });
  });

  it("moves through assigned, in progress and resolved, recording who did what", async () => {
    const { service, load } = await setup();
    await service.advance(await load(), "assigned", "Technician booked for 2pm", facilities);
    await service.advance(await load(), "in-progress", "", facilities);
    await service.advance(await load(), "resolved", "Drain cleared, unit working", facilities);
    const issue = await load();
    expect(issue.status).toBe("resolved");
    expect(issue.assignedTo).toEqual(facilities);
    expect(issue.updates.map((u) => u.status)).toEqual(["submitted", "assigned", "in-progress", "resolved"]);
    expect(issue.updates[1]?.note).toBe("Technician booked for 2pm");
    expect(issue.updates[2]?.note).toMatch(/in progress/i);
  });

  it("notifies the reporter, and only the reporter, at every step", async () => {
    const { world, service, load } = await setup();
    await service.advance(await load(), "assigned", "On it", facilities);
    const mine = await world.store.list("notifications", { where: [{ field: "recipientId", op: "==", value: student.id }] });
    expect(mine.items.some((n) => (n as unknown as { type: string }).type === "facility")).toBe(true);
    const others = await world.store.list("notifications", { where: [{ field: "recipientId", op: "==", value: "u-student2" }] });
    expect(others.items.some((n) => (n as unknown as { type: string; body: string }).body.includes("On it"))).toBe(false);
  });

  it("does not allow skipping steps or going backwards", async () => {
    const { service, load } = await setup();
    await expect(service.advance(await load(), "resolved", "", facilities)).rejects.toBeInstanceOf(AppError);
    await expect(service.advance(await load(), "in-progress", "", facilities)).rejects.toBeInstanceOf(AppError);
    await service.advance(await load(), "assigned", "", facilities);
    await expect(service.advance(await load(), "submitted", "", facilities)).rejects.toBeInstanceOf(AppError);
    expect((await load()).updates).toHaveLength(2);
  });

  it("does not reopen a resolved issue", async () => {
    const { service, load } = await setup();
    await service.advance(await load(), "assigned", "", facilities);
    await service.advance(await load(), "resolved", "", facilities);
    expect(nextFacilityStatuses("resolved")).toEqual([]);
    await expect(service.advance(await load(), "assigned", "", facilities)).rejects.toBeInstanceOf(AppError);
  });

  it("lists a student's own reports only", async () => {
    const { service } = await setup();
    const mine = await service.listMine(student.id);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((i) => i.reporter.id === student.id)).toBe(true);
  });

  it("describes the allowed transitions", () => {
    expect(canTransitionFacility("submitted", "assigned")).toBe(true);
    expect(canTransitionFacility("assigned", "resolved")).toBe(true);
    expect(canTransitionFacility("submitted", "resolved")).toBe(false);
    expect(isOpenIssue({ status: "in-progress" })).toBe(true);
    expect(isOpenIssue({ status: "resolved" })).toBe(false);
  });
});

describe("routing and ordering", () => {
  const make = (id: string, category: FacilityIssue["category"], priority: FacilityIssue["priority"], status: FacilityIssue["status"], createdAt: string): FacilityIssue => ({
    id,
    category,
    priority,
    status,
    location: "Somewhere",
    description: "A problem that needs fixing soon",
    imageUrl: null,
    imagePath: null,
    reporter: student,
    assignedTo: null,
    updates: [],
    createdAt,
    updatedAt: createdAt,
  });

  const issues = [
    make("ac", "air-conditioning", "medium", "submitted", "2026-09-10T08:00:00Z"),
    make("wifi", "internet", "urgent", "submitted", "2026-09-11T08:00:00Z"),
    make("chair", "furniture", "low", "submitted", "2026-09-09T08:00:00Z"),
    make("done", "equipment", "urgent", "resolved", "2026-09-01T08:00:00Z"),
    make("light", "lighting", "medium", "submitted", "2026-09-08T08:00:00Z"),
  ];

  it("routes internet and equipment problems to IT, everything else to Facilities", () => {
    expect(teamForCategory("internet")).toBe("it");
    expect(teamForCategory("equipment")).toBe("it");
    expect(teamForCategory("plumbing")).toBe("facilities");
    expect(teamForCategory("air-conditioning")).toBe("facilities");
  });

  it("shows each team its own issues, and administrators or other staff everything", () => {
    expect(issuesForTeam(issues, "it").map((i) => i.id)).toEqual(["wifi", "done"]);
    expect(issuesForTeam(issues, "facilities").map((i) => i.id)).toEqual(["ac", "chair", "light"]);
    expect(issuesForTeam(issues, null)).toHaveLength(5);
    expect(issuesForTeam(issues, "finance")).toHaveLength(5);
  });

  it("puts open urgent issues first, then oldest first, resolved last", () => {
    expect(sortIssues(issues).map((i) => i.id)).toEqual(["wifi", "light", "ac", "chair", "done"]);
  });

  it("filters by status, priority, category and text", () => {
    const base = { query: "", status: "all", priority: "all", category: "all" } as const;
    expect(filterIssues(issues, { ...base, status: "resolved" }).map((i) => i.id)).toEqual(["done"]);
    expect(filterIssues(issues, { ...base, priority: "urgent" })).toHaveLength(2);
    expect(filterIssues(issues, { ...base, category: "lighting" }).map((i) => i.id)).toEqual(["light"]);
    expect(filterIssues(issues, { ...base, query: "no such thing" })).toEqual([]);
  });
});

describe("facility form validation", () => {
  it("accepts a complete report", () => {
    expect(facilityIssueSchema.safeParse(report).success).toBe(true);
  });

  it("requires a real description and location, and a known category and priority", () => {
    expect(facilityIssueSchema.safeParse({ ...report, description: "broken" }).success).toBe(false);
    expect(facilityIssueSchema.safeParse({ ...report, location: "A" }).success).toBe(false);
    expect(facilityIssueSchema.safeParse({ ...report, category: "magic" }).success).toBe(false);
    expect(facilityIssueSchema.safeParse({ ...report, priority: "whenever" }).success).toBe(false);
  });
});
