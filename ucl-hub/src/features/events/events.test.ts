import { describe, expect, it } from "vitest";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import type { CampusEvent } from "@/types";
import { addDays } from "@/utils/dates";
import { AppError } from "@/utils/errors";
import { canRegisterInterest, eventStatus, filterEvents, groupEventsByDay, isFull, spotsLeft, windowFor } from "./logic";
import { eventSchema, type EventInput } from "./schema";
import { createEventService } from "./service";

const hours = (n: number) => new Date(TEST_NOW.getTime() + n * 3_600_000).toISOString();
const user = (n: number) => ({ id: `u-test-${n}`, name: `Student ${n}` });
const organiser = { id: "u-society", name: "Dilan" };

function eventInput(overrides: Partial<EventInput> = {}): EventInput {
  return {
    title: "Hack night",
    description: "An evening of building things together.",
    startsAt: hours(48),
    endsAt: hours(52),
    location: "Block C lab",
    organiser: "Computing Society",
    societyId: "soc-computing",
    category: "technology",
    capacity: 0,
    imageUrl: null,
    imagePath: null,
    ...overrides,
  };
}

async function setup(overrides: Partial<EventInput> = {}) {
  const world = createTestWorld();
  const service = createEventService(world.store, world.clock);
  const id = await service.create(eventInput(overrides), organiser);
  const load = async () => (await service.get(id))!;
  return { world, service, id, load };
}

describe("event interest", () => {
  it("registers interest once and counts it", async () => {
    const { service, load } = await setup();
    await service.registerInterest(await load(), user(1));
    expect((await load()).interestCount).toBe(1);
    expect(await service.getInterestedEventIds(user(1).id)).toContain((await load()).id);
  });

  it("ignores a repeated registration (double click, second tab)", async () => {
    const { service, load } = await setup();
    await service.registerInterest(await load(), user(1));
    await service.registerInterest(await load(), user(1));
    expect((await load()).interestCount).toBe(1);
  });

  it("counts simultaneous double submissions only once", async () => {
    const { service, load } = await setup();
    const event = await load();
    await Promise.all([service.registerInterest(event, user(1)), service.registerInterest(event, user(1))]);
    expect((await load()).interestCount).toBe(1);
  });

  it("cancels interest and lowers the count, and cancelling twice is harmless", async () => {
    const { service, load } = await setup();
    await service.registerInterest(await load(), user(1));
    await service.registerInterest(await load(), user(2));
    await service.cancelInterest(await load(), user(1));
    await service.cancelInterest(await load(), user(1));
    expect((await load()).interestCount).toBe(1);
    expect((await service.getInterestedEventIds(user(1).id)).size).toBe(0);
  });

  it("stops registrations when the event is full", async () => {
    const { service, load } = await setup({ capacity: 2 });
    await service.registerInterest(await load(), user(1));
    await service.registerInterest(await load(), user(2));
    await expect(service.registerInterest(await load(), user(3))).rejects.toThrow(/full/i);
    expect((await load()).interestCount).toBe(2);
  });

  it("lets someone who already registered cancel even when the event is full", async () => {
    const { service, load } = await setup({ capacity: 1 });
    await service.registerInterest(await load(), user(1));
    await service.cancelInterest(await load(), user(1));
    await expect(service.registerInterest(await load(), user(2))).resolves.toBeUndefined();
  });

  it("does not accept interest in an event that has finished", async () => {
    const { service, load } = await setup({ startsAt: hours(-5), endsAt: hours(-3) });
    await expect(service.registerInterest(await load(), user(1))).rejects.toBeInstanceOf(AppError);
  });

  it("removes interest records when an event is deleted", async () => {
    const { world, service, load, id } = await setup();
    await service.registerInterest(await load(), user(1));
    await service.remove(id);
    expect(await service.get(id)).toBeNull();
    expect(await world.store.count("eventInterests", [{ field: "eventId", op: "==", value: id }])).toBe(0);
  });

  it("notifies students when an organiser publishes an event", async () => {
    const { world } = await setup();
    const notes = await world.store.list("notifications", { where: [{ field: "type", op: "==", value: "event" }] });
    expect(notes.items.some((n) => String((n as unknown as { title: string }).title).startsWith("New event"))).toBe(true);
  });
});

describe("event rules", () => {
  it("computes status from the clock", () => {
    expect(eventStatus({ startsAt: hours(1), endsAt: hours(2) }, TEST_NOW)).toBe("upcoming");
    expect(eventStatus({ startsAt: hours(-1), endsAt: hours(1) }, TEST_NOW)).toBe("ongoing");
    expect(eventStatus({ startsAt: hours(-3), endsAt: hours(-1) }, TEST_NOW)).toBe("past");
  });

  it("treats capacity 0 as unlimited", () => {
    expect(spotsLeft({ capacity: 0, interestCount: 500 })).toBeNull();
    expect(isFull({ capacity: 0, interestCount: 500 })).toBe(false);
    expect(spotsLeft({ capacity: 10, interestCount: 4 })).toBe(6);
    expect(isFull({ capacity: 10, interestCount: 10 })).toBe(true);
  });

  it("explains why registration is refused", () => {
    const open = { startsAt: hours(5), endsAt: hours(6), capacity: 5, interestCount: 0 };
    expect(canRegisterInterest(open, false, TEST_NOW)).toEqual({ ok: true });
    expect(canRegisterInterest(open, true, TEST_NOW)).toMatchObject({ ok: false });
    expect(canRegisterInterest({ ...open, interestCount: 5 }, false, TEST_NOW)).toMatchObject({ ok: false });
    expect(canRegisterInterest({ ...open, startsAt: hours(-3), endsAt: hours(-2) }, false, TEST_NOW)).toMatchObject({ ok: false });
  });

  it("validates organiser forms: end after start, sensible capacity", () => {
    const valid = eventInput();
    expect(eventSchema.safeParse(valid).success).toBe(true);
    const backwards = eventSchema.safeParse({ ...valid, startsAt: hours(10), endsAt: hours(9) });
    expect(backwards.success).toBe(false);
    expect(JSON.stringify(backwards.error?.issues)).toContain("endsAt");
    expect(eventSchema.safeParse({ ...valid, startsAt: "not a date" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, capacity: -1 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, title: "Hi" }).success).toBe(false);
  });
});

describe("event browsing", () => {
  const make = (id: string, startHours: number, category: CampusEvent["category"] = "community"): CampusEvent => ({
    id,
    title: `Event ${id}`,
    description: "desc",
    startsAt: hours(startHours),
    endsAt: hours(startHours + 1),
    location: "Hall",
    organiser: "Org",
    societyId: null,
    category,
    capacity: 0,
    interestCount: 0,
    imageUrl: null,
    imagePath: null,
    createdBy: organiser,
    createdAt: hours(-100),
  });

  it("filters by time window and category", () => {
    const events = [make("today", 2), make("nextMonth", 24 * 40), make("career", 3, "career")];
    expect(filterEvents(events, { query: "", category: "all", when: "today" }, TEST_NOW).map((e) => e.id)).toEqual(["today", "career"]);
    expect(filterEvents(events, { query: "", category: "career", when: "all" }, TEST_NOW).map((e) => e.id)).toEqual(["career"]);
    expect(filterEvents(events, { query: "", category: "all", when: "month" }, TEST_NOW).map((e) => e.id)).not.toContain("nextMonth");
  });

  it("returns nothing (not everything) for a search with no matches, and everything for an empty search", () => {
    const events = [make("a", 2), make("b", 3)];
    expect(filterEvents(events, { query: "zzzz", category: "all", when: "all" }, TEST_NOW)).toEqual([]);
    expect(filterEvents(events, { query: "   ", category: "all", when: "all" }, TEST_NOW)).toHaveLength(2);
  });

  it("groups by day in date order", () => {
    const groups = groupEventsByDay([make("b", 30), make("a", 2), make("c", 3)]);
    expect(groups.map(([, items]) => items.length)).toEqual([2, 1]);
    expect(groups[0]?.[0] && groups[0][0] < (groups[1]?.[0] ?? "")).toBe(true);
  });

  it("builds the week window Monday to Sunday", () => {
    const { from, to } = windowFor("week", TEST_NOW);
    expect(from.getDay()).toBe(1);
    expect(to.getDay()).toBe(0);
    expect(to.getTime()).toBeGreaterThan(addDays(from, 6).getTime());
    expect(addDays(from, 2).getDate()).toBe(TEST_NOW.getDate());
  });

  it("lists upcoming events from the demo data and none from the past", async () => {
    const world = createTestWorld();
    const service = createEventService(world.store, world.clock);
    const upcoming = await service.listUpcoming(undefined, 100);
    expect(upcoming.items.length).toBeGreaterThan(3);
    expect(upcoming.items.every((e) => new Date(e.endsAt) >= TEST_NOW)).toBe(true);
    const past = await service.listPast(undefined, 100);
    expect(past.items.every((e) => new Date(e.endsAt) < TEST_NOW)).toBe(true);
  });
});
