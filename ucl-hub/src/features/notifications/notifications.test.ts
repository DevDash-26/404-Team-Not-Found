import { describe, expect, it } from "vitest";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import { EVERYONE, type AppNotification, type CampusEvent } from "@/types";
import { validate } from "@/lib/validation";
import { buildNotificationFeed, deriveEventReminders, REMINDER_PREFIX, unreadCount } from "./logic";
import { broadcastSchema } from "./schema";
import { createNotificationService } from "./service";

const hours = (n: number) => new Date(TEST_NOW.getTime() + n * 3_600_000).toISOString();
const note = (over: Partial<AppNotification>): AppNotification => ({
  id: "n",
  title: "Title",
  body: "Body",
  type: "announcement",
  link: "/announcements",
  recipientId: null,
  audience: EVERYONE,
  createdBy: "u-admin",
  createdAt: hours(-1),
  ...over,
});

describe("notification feed", () => {
  it("merges broadcasts and personal notifications, newest first", () => {
    const feed = buildNotificationFeed({
      broadcasts: [note({ id: "b", createdAt: hours(-5) })],
      personal: [note({ id: "p", recipientId: "me", createdAt: hours(-1) })],
      derived: [],
      readIds: new Set(),
      target: null,
    });
    expect(feed.map((n) => n.id)).toEqual(["p", "b"]);
  });

  it("filters broadcasts by the student's faculty and year but never personal messages", () => {
    const targeted = note({ id: "biz", audience: { faculties: ["business"], programmes: [], years: [] } });
    const personal = note({ id: "mine", recipientId: "me", audience: { faculties: ["business"], programmes: [], years: [] } });
    const feed = buildNotificationFeed({ broadcasts: [targeted], personal: [personal], derived: [], readIds: new Set(), target: { faculty: "computing", programme: "Data Science", year: 1 } });
    expect(feed.map((n) => n.id)).toEqual(["mine"]);
  });

  it("marks read state and counts unread", () => {
    const feed = buildNotificationFeed({ broadcasts: [note({ id: "a" }), note({ id: "b" }), note({ id: "c" })], personal: [], derived: [], readIds: new Set(["b"]), target: null });
    expect(feed.find((n) => n.id === "b")?.read).toBe(true);
    expect(unreadCount(feed)).toBe(2);
  });

  it("does not list the same notification twice", () => {
    const dup = note({ id: "same" });
    expect(buildNotificationFeed({ broadcasts: [dup], personal: [dup], derived: [], readIds: new Set(), target: null })).toHaveLength(1);
  });
});

describe("event reminders", () => {
  const event = (id: string, startHours: number): CampusEvent => ({
    id,
    title: `Event ${id}`,
    description: "d",
    startsAt: hours(startHours),
    endsAt: hours(startHours + 1),
    location: "Hall B",
    organiser: "Org",
    societyId: null,
    category: "community",
    capacity: 0,
    interestCount: 0,
    imageUrl: null,
    imagePath: null,
    createdBy: { id: "x", name: "X" },
    createdAt: hours(-50),
  });

  it("reminds only about events the student is interested in that start soon", () => {
    const reminders = deriveEventReminders([event("soon", 5), event("later", 200), event("past", -3), event("other", 4)], new Set(["soon", "later", "past"]), TEST_NOW);
    expect(reminders.map((r) => r.id)).toEqual([`${REMINDER_PREFIX}soon`]);
    expect(reminders[0]?.body).toContain("Hall B");
  });

  it("marks reminders as computed on the device", () => {
    const reminders = deriveEventReminders([event("soon", 5)], new Set(["soon"]), TEST_NOW);
    const feed = buildNotificationFeed({ broadcasts: [], personal: [], derived: reminders, readIds: new Set(), target: null });
    expect(feed[0]?.derived).toBe(true);
  });
});

describe("notification service", () => {
  const me = { id: "u-student1", role: "student" as const, faculty: "computing", programme: "Software Engineering", year: 2 };

  it("builds the feed for a student and remembers what they have read", async () => {
    const world = createTestWorld();
    const service = createNotificationService(world.store, world.clock);
    const feed = await service.getFeed(me);
    expect(feed.length).toBeGreaterThan(0);
    const first = feed.find((n) => !n.derived && !n.read);
    expect(first).toBeDefined();
    await service.markRead(me.id, [first!.id]);
    expect((await service.getFeed(me)).find((n) => n.id === first!.id)?.read).toBe(true);
    // Another student's read state is separate.
    expect((await service.getFeed({ ...me, id: "u-student2" })).find((n) => n.id === first!.id)?.read).toBeFalsy();
  });

  it("delivers a broadcast to its audience and lets staff delete it", async () => {
    const world = createTestWorld();
    const service = createNotificationService(world.store, world.clock);
    await service.broadcast({ title: "Year 2 briefing", body: "Room A101 at 3pm.", type: "system", link: "/calendar", audience: { faculties: [], programmes: [], years: [2] } }, { id: "u-academic" });
    expect((await service.getFeed(me)).some((n) => n.title === "Year 2 briefing")).toBe(true);
    expect((await service.getFeed({ ...me, year: 3 })).some((n) => n.title === "Year 2 briefing")).toBe(false);
    const all = await service.listAll(undefined, 100);
    const created = all.items.find((n) => n.title === "Year 2 briefing")!;
    await service.remove(created.id);
    expect((await service.getFeed(me)).some((n) => n.title === "Year 2 briefing")).toBe(false);
  });

  it("does nothing when asked to mark an empty list as read", async () => {
    const world = createTestWorld();
    const service = createNotificationService(world.store, world.clock);
    await expect(service.markRead(me.id, [])).resolves.toBeUndefined();
  });
});

describe("broadcast form", () => {
  const valid = { title: "Maintenance tonight", body: "Wi-Fi will be down from 10pm.", type: "system", link: "/it-support", audience: EVERYONE };
  it("accepts in-app paths and web links only", () => {
    expect(validate(broadcastSchema, valid).ok).toBe(true);
    expect(validate(broadcastSchema, { ...valid, link: "https://ucl.example/news" }).ok).toBe(true);
    expect(validate(broadcastSchema, { ...valid, link: "javascript:alert(1)" }).ok).toBe(false);
    expect(validate(broadcastSchema, { ...valid, link: "events" }).ok).toBe(false);
  });
  it("limits the message length", () => {
    expect(validate(broadcastSchema, { ...valid, body: "x".repeat(241) }).ok).toBe(false);
    expect(validate(broadcastSchema, { ...valid, body: "hey" }).ok).toBe(false);
  });
});
