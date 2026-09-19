import { describe, expect, it } from "vitest";
import { matchesAudience, describeAudience, targetOf } from "@/lib/audience";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import type { Announcement } from "@/types";
import { EVERYONE } from "@/types";
import { filterAnnouncements, isActive, pickActiveEmergency, sortByImportance } from "./logic";
import { announcementSchema, type AnnouncementInput } from "./schema";
import { createAnnouncementService } from "./service";

const hours = (n: number) => new Date(TEST_NOW.getTime() + n * 3_600_000).toISOString();
const staff = { id: "u-academic", name: "Academic Office" };

const se2 = { role: "student" as const, faculty: "computing", programme: "Software Engineering", year: 2 };
const biz1 = { role: "student" as const, faculty: "business", programme: "Marketing", year: 1 };
const eng3 = { role: "student" as const, faculty: "engineering", programme: "Civil Engineering", year: 3 };
const admin = { role: "admin" as const, faculty: null, programme: null, year: null };

function input(overrides: Partial<AnnouncementInput> = {}): AnnouncementInput {
  return {
    title: "Targeted notice",
    description: "This notice is only for some students.",
    category: "academic",
    priority: "normal",
    source: "Registrar's Office",
    audience: EVERYONE,
    attachments: [],
    expiresAt: null,
    ...overrides,
  };
}

describe("audience targeting", () => {
  it("shows untargeted content to every student", () => {
    expect(matchesAudience(EVERYONE, targetOf(se2))).toBe(true);
    expect(matchesAudience(EVERYONE, targetOf(biz1))).toBe(true);
  });

  it("matches by faculty, programme and year, all of which must agree", () => {
    const audience = { faculties: ["computing"], programmes: ["Software Engineering"], years: [2] };
    expect(matchesAudience(audience, targetOf(se2))).toBe(true);
    expect(matchesAudience(audience, targetOf({ ...se2, year: 3 }))).toBe(false);
    expect(matchesAudience(audience, targetOf({ ...se2, programme: "Data Science" }))).toBe(false);
    expect(matchesAudience(audience, targetOf(biz1))).toBe(false);
  });

  it("supports year-only and faculty-only targeting", () => {
    expect(matchesAudience({ faculties: [], programmes: [], years: [1] }, targetOf(biz1))).toBe(true);
    expect(matchesAudience({ faculties: [], programmes: [], years: [1] }, targetOf(se2))).toBe(false);
    expect(matchesAudience({ faculties: ["business"], programmes: [], years: [] }, targetOf(se2))).toBe(false);
  });

  it("does not show targeted content to a student with an incomplete profile", () => {
    expect(matchesAudience({ faculties: ["computing"], programmes: [], years: [] }, { faculty: null, programme: null, year: null })).toBe(false);
  });

  it("shows staff everything (no target)", () => {
    expect(matchesAudience({ faculties: ["computing"], programmes: [], years: [3] }, null)).toBe(true);
  });

  it("describes the audience in words", () => {
    expect(describeAudience(EVERYONE)).toBe("All students");
    expect(describeAudience({ faculties: ["computing"], programmes: [], years: [2, 3] })).toBe("Computing · Year 2, Year 3");
  });
});

describe("announcement feed", () => {
  async function setup() {
    const world = createTestWorld();
    const service = createAnnouncementService(world.store, world.clock);
    await service.create(input({ title: "Business only", audience: { faculties: ["business"], programmes: [], years: [] } }), staff);
    await service.create(input({ title: "Engineering Y3 only", audience: { faculties: ["engineering"], programmes: [], years: [3] } }), staff);
    await service.create(input({ title: "Expired notice", expiresAt: hours(-1) }), staff);
    await service.create(input({ title: "Expiring later", expiresAt: hours(5) }), staff);
    return { world, service };
  }

  async function titlesFor(service: ReturnType<typeof createAnnouncementService>, profile: Parameters<typeof service.listForProfile>[0]) {
    const page = await service.listForProfile(profile, undefined, 100);
    return page.items.map((a) => a.title);
  }

  it("delivers each announcement to the right students only", async () => {
    const { service } = await setup();
    const forSe2 = await titlesFor(service, se2);
    const forBiz = await titlesFor(service, biz1);
    const forEng = await titlesFor(service, eng3);
    expect(forSe2).not.toContain("Business only");
    expect(forSe2).not.toContain("Engineering Y3 only");
    expect(forBiz).toContain("Business only");
    expect(forEng).toContain("Engineering Y3 only");
    expect(forEng).not.toContain("Business only");
  });

  it("hides expired announcements from students but keeps them in the management list", async () => {
    const { service } = await setup();
    expect(await titlesFor(service, se2)).not.toContain("Expired notice");
    expect(await titlesFor(service, se2)).toContain("Expiring later");
    const managed = await service.listAll(undefined, 100);
    expect(managed.items.map((a) => a.title)).toContain("Expired notice");
  });

  it("gives administrators and staff the untargeted view of everything active", async () => {
    const { service } = await setup();
    const titles = await titlesFor(service, admin);
    expect(titles).toEqual(expect.arrayContaining(["Business only", "Engineering Y3 only"]));
  });

  it("notifies only the targeted audience when an announcement is published", async () => {
    const { world } = await setup();
    const notes = await world.store.list<{ id: string; title: string; audience: typeof EVERYONE }>("notifications", { where: [{ field: "title", op: "==", value: "Business only" }] });
    expect(notes.items).toHaveLength(1);
    expect(matchesAudience(notes.items[0]?.audience, targetOf(biz1))).toBe(true);
    expect(matchesAudience(notes.items[0]?.audience, targetOf(se2))).toBe(false);
  });

  it("pages through results without duplicates", async () => {
    const { service } = await setup();
    const first = await service.listForProfile(se2, undefined, 3);
    const second = await service.listForProfile(se2, first.nextCursor ?? undefined, 3);
    const ids = [...first.items, ...second.items].map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("emergency announcements", () => {
  const make = (over: Partial<Announcement>): Announcement => ({
    id: "a1",
    title: "Campus closed",
    description: "Closed due to flooding.",
    category: "safety",
    priority: "emergency",
    audience: EVERYONE,
    author: staff,
    source: "Security",
    attachments: [],
    createdAt: hours(-2),
    expiresAt: null,
    ...over,
  });

  it("picks the newest active emergency relevant to the student", () => {
    const older = make({ id: "old", createdAt: hours(-10) });
    const newer = make({ id: "new", createdAt: hours(-1) });
    expect(pickActiveEmergency([older, newer], targetOf(se2), TEST_NOW)?.id).toBe("new");
  });

  it("ignores expired, non-emergency and off-audience notices", () => {
    expect(pickActiveEmergency([make({ expiresAt: hours(-1) })], targetOf(se2), TEST_NOW)).toBeNull();
    expect(pickActiveEmergency([make({ priority: "important" })], targetOf(se2), TEST_NOW)).toBeNull();
    expect(pickActiveEmergency([make({ audience: { faculties: ["business"], programmes: [], years: [] } })], targetOf(se2), TEST_NOW)).toBeNull();
  });

  it("sorts emergency first, then important, then newest", () => {
    const items = [
      make({ id: "n1", priority: "normal", createdAt: hours(-1) }),
      make({ id: "i1", priority: "important", createdAt: hours(-5) }),
      make({ id: "e1", priority: "emergency", createdAt: hours(-9) }),
      make({ id: "n2", priority: "normal", createdAt: hours(-3) }),
    ];
    expect(sortByImportance(items).map((a) => a.id)).toEqual(["e1", "i1", "n1", "n2"]);
  });

  it("sends an emergency notification with the emergency type", async () => {
    const world = createTestWorld();
    const service = createAnnouncementService(world.store, world.clock);
    await service.create(input({ title: "Evacuate Block A", priority: "emergency", category: "safety" }), staff);
    const notes = await world.store.list<{ id: string; type: string }>("notifications", { where: [{ field: "type", op: "==", value: "emergency" }] });
    expect(notes.items.length).toBeGreaterThan(0);
    expect((await service.getActiveEmergency(se2))?.title).toBe("Evacuate Block A");
  });
});

describe("filters and validation", () => {
  const items: Announcement[] = [
    { id: "1", title: "Library hours", description: "Extended hours", category: "general", priority: "normal", audience: EVERYONE, author: staff, source: "Library", attachments: [], createdAt: hours(-1), expiresAt: null },
    { id: "2", title: "Fee deadline", description: "Pay before Friday", category: "finance", priority: "important", audience: EVERYONE, author: staff, source: "Finance Office", attachments: [], createdAt: hours(-2), expiresAt: null },
  ];

  it("filters by category, priority and search text", () => {
    expect(filterAnnouncements(items, { query: "", category: "finance", priority: "all" }).map((a) => a.id)).toEqual(["2"]);
    expect(filterAnnouncements(items, { query: "", category: "all", priority: "important" }).map((a) => a.id)).toEqual(["2"]);
    expect(filterAnnouncements(items, { query: "library", category: "all", priority: "all" }).map((a) => a.id)).toEqual(["1"]);
    expect(filterAnnouncements(items, { query: "nothing here", category: "all", priority: "all" })).toEqual([]);
  });

  it("treats an announcement as active until its expiry passes", () => {
    expect(isActive({ expiresAt: null }, TEST_NOW)).toBe(true);
    expect(isActive({ expiresAt: hours(1) }, TEST_NOW)).toBe(true);
    expect(isActive({ expiresAt: hours(-1) }, TEST_NOW)).toBe(false);
  });

  it("validates the staff form", () => {
    expect(announcementSchema.safeParse(input()).success).toBe(true);
    expect(announcementSchema.safeParse(input({ title: "Hi" })).success).toBe(false);
    expect(announcementSchema.safeParse(input({ description: "short" })).success).toBe(false);
    expect(announcementSchema.safeParse({ ...input(), priority: "urgent" }).success).toBe(false);
    expect(announcementSchema.safeParse(input({ attachments: Array.from({ length: 6 }, (_, i) => ({ name: `f${i}`, url: "u", path: "p" })) })).success).toBe(false);
  });

  it("trims text and removes control characters before storing (markup is escaped when rendered, never injected)", () => {
    const parsed = announcementSchema.safeParse(input({ title: "  Big\u0000 news\u0007  " }));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.title).toBe("Big news");
  });
});
