import { describe, expect, it } from "vitest";
import { createTestWorld } from "@/test/helpers";
import type { SupportRequest } from "@/types";
import { AppError } from "@/utils/errors";
import { validate } from "@/lib/validation";
import { canTransitionSupport, filterSupport } from "./logic";
import { supportDecisionSchema, supportRequestSchema } from "./schema";
import { createSupportService } from "./service";

const student = { id: "u-student1", name: "Amaya", faculty: "computing", programme: "Software Engineering", year: 2 };
const staff = { id: "u-academic", name: "Dr. Nadeesha" };

async function setup() {
  const world = createTestWorld();
  const service = createSupportService(world.store, world.clock);
  const id = await service.create({ type: "peer-tutoring", subject: "Data structures", description: "I need help with trees and graphs before the exam.", preferredTimes: "Evenings" }, student);
  const load = async () => (await world.store.get<SupportRequest>(`supportRequests/${id}`))!;
  return { world, service, id, load };
}

describe("academic support matching", () => {
  it("records the student's academic context with the request", async () => {
    const { load } = await setup();
    expect(await load()).toMatchObject({ status: "open", matchedWith: null, programme: "Software Engineering", year: 2, requester: { id: student.id } });
  });

  it("matches a student with a tutor and notifies them", async () => {
    const { world, service, load } = await setup();
    await service.decide(await load(), { status: "matched", matchedName: "Ishara Perera", matchedEmail: "ishara@ucl.example", staffNote: "Meet Tuesday 5pm" }, staff);
    expect(await load()).toMatchObject({ status: "matched", matchedWith: { name: "Ishara Perera", email: "ishara@ucl.example" }, staffNote: "Meet Tuesday 5pm" });
    const notes = await world.store.list("notifications", { where: [{ field: "recipientId", op: "==", value: student.id }] });
    expect(notes.items.some((n) => (n as unknown as { body: string }).body.includes("Ishara Perera"))).toBe(true);
  });

  it("lets the student withdraw, and staff reopen a closed request", async () => {
    const { service, load } = await setup();
    await service.close(await load());
    expect((await load()).status).toBe("closed");
    await service.decide(await load(), { status: "open", matchedName: "", matchedEmail: "", staffNote: "" }, staff);
    expect((await load()).status).toBe("open");
  });

  it("only lists a student's own requests in their view", async () => {
    const { service } = await setup();
    const mine = await service.listMine(student.id);
    expect(mine.every((r) => r.requester.id === student.id)).toBe(true);
  });

  it("describes which status changes are allowed", () => {
    expect(canTransitionSupport("open", "matched")).toBe(true);
    expect(canTransitionSupport("closed", "matched")).toBe(false);
    expect(canTransitionSupport("open", "open")).toBe(true);
  });

  it("filters the staff queue by status and text", () => {
    const items = [
      { id: "1", subject: "Calculus", description: "Limits", requester: { id: "a", name: "Nimal" }, type: "peer-tutoring", status: "open" },
      { id: "2", subject: "Web project", description: "Team needed", requester: { id: "b", name: "Sachini" }, type: "study-group", status: "matched" },
    ] as unknown as SupportRequest[];
    expect(filterSupport(items, { query: "", status: "open" }).map((i) => i.id)).toEqual(["1"]);
    expect(filterSupport(items, { query: "sachini", status: "all" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterSupport(items, { query: "zzz", status: "all" })).toEqual([]);
  });

  it("refuses an impossible decision without changing anything", async () => {
    const { service, load } = await setup();
    await service.close(await load());
    await expect(service.decide(await load(), { status: "matched", matchedName: "X Y", matchedEmail: "", staffNote: "" }, staff)).rejects.toBeInstanceOf(AppError);
  });
});

describe("support forms", () => {
  it("requires a subject, details and a known type", () => {
    const valid = { type: "mentorship", subject: "Career advice", description: "I would like a mentor in software engineering.", preferredTimes: "" };
    expect(supportRequestSchema.safeParse(valid).success).toBe(true);
    expect(supportRequestSchema.safeParse({ ...valid, subject: "ab" }).success).toBe(false);
    expect(supportRequestSchema.safeParse({ ...valid, type: "babysitting" }).success).toBe(false);
  });

  it("asks staff who the student is matched with when marking a request matched", () => {
    const result = validate(supportDecisionSchema, { status: "matched", matchedName: "", matchedEmail: "", staffNote: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.matchedName).toBeDefined();
    expect(validate(supportDecisionSchema, { status: "closed", matchedName: "", matchedEmail: "", staffNote: "" }).ok).toBe(true);
    expect(validate(supportDecisionSchema, { status: "matched", matchedName: "A B", matchedEmail: "bad", staffNote: "" }).ok).toBe(false);
  });
});
