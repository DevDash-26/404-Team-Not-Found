import { describe, expect, it } from "vitest";
import { createTestWorld } from "@/test/helpers";
import type { LostFoundItem } from "@/types";
import { toDateKey } from "@/utils/dates";
import { AppError } from "@/utils/errors";
import { canManageItem, DEFAULT_LOST_FOUND_FILTERS, filterLostFound, nextLostFoundStatuses, suggestMatches } from "./logic";
import { lostFoundSchema, type LostFoundInput } from "./schema";
import { createLostFoundService } from "./service";

const maker = (over: Partial<LostFoundItem>): LostFoundItem => ({
  id: "x",
  type: "lost",
  title: "Blue water bottle",
  description: "Insulated bottle with a sticker",
  category: "accessories",
  location: "Library",
  date: "2026-09-15",
  imageUrl: null,
  imagePath: null,
  contact: { type: "front-desk", value: "" },
  status: "open",
  reporter: { id: "u1", name: "One" },
  createdAt: "2026-09-15T10:00:00.000Z",
  ...over,
});

describe("lost & found filtering", () => {
  const items = [
    maker({ id: "1", title: "Black laptop charger", category: "electronics", location: "Library" }),
    maker({ id: "2", type: "found", title: "Blue water bottle", category: "accessories", location: "Block B" }),
    maker({ id: "3", type: "found", title: "Keys with red keychain", category: "keys", status: "claimed" }),
    maker({ id: "4", title: "Student ID", category: "documents-ids", status: "resolved" }),
  ];

  it("shows open items by default", () => {
    expect(filterLostFound(items, DEFAULT_LOST_FOUND_FILTERS).map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("filters by type, category and status together", () => {
    expect(filterLostFound(items, { ...DEFAULT_LOST_FOUND_FILTERS, type: "found" }).map((i) => i.id)).toEqual(["2"]);
    expect(filterLostFound(items, { query: "", type: "all", category: "keys", status: "all" }).map((i) => i.id)).toEqual(["3"]);
    expect(filterLostFound(items, { query: "", type: "all", category: "all", status: "resolved" }).map((i) => i.id)).toEqual(["4"]);
  });

  it("searches title, description, location and category, ignoring case and accents", () => {
    expect(filterLostFound(items, { ...DEFAULT_LOST_FOUND_FILTERS, query: "CHARGER" }).map((i) => i.id)).toEqual(["1"]);
    expect(filterLostFound(items, { ...DEFAULT_LOST_FOUND_FILTERS, query: "block b" }).map((i) => i.id)).toEqual(["2"]);
  });

  it("returns an empty list, not everything, when nothing matches", () => {
    expect(filterLostFound(items, { ...DEFAULT_LOST_FOUND_FILTERS, query: "zebra" })).toEqual([]);
  });

  it("treats a blank search as no search", () => {
    expect(filterLostFound(items, { ...DEFAULT_LOST_FOUND_FILTERS, query: "   " })).toHaveLength(2);
  });

  it("suggests a matching found item for a lost one, in the same category", () => {
    const lost = maker({ id: "l", type: "lost", title: "Blue bottle", category: "accessories" });
    expect(suggestMatches(lost, items).map((i) => i.id)).toEqual(["2"]);
    expect(suggestMatches(maker({ id: "l2", title: "Green umbrella", category: "accessories" }), items)).toEqual([]);
  });
});

describe("lost & found workflow", () => {
  const reporter = { id: "u-student2", name: "Kasun" };

  async function setup() {
    const world = createTestWorld();
    const service = createLostFoundService(world.store, world.clock);
    const input: LostFoundInput = {
      type: "found",
      title: "Grey hoodie",
      description: "Found on a chair in the canteen.",
      category: "clothing",
      location: "Canteen",
      date: toDateKey(world.now),
      imageUrl: null,
      imagePath: null,
      contact: { type: "front-desk", value: "" },
    };
    const id = await service.create(input, reporter);
    return { world, service, id };
  }

  it("creates reports as open, owned by the reporter", async () => {
    const { world, id } = await setup();
    const item = await world.store.get<LostFoundItem>(`lostFound/${id}`);
    expect(item).toMatchObject({ status: "open", reporter });
  });

  it("clears the contact value for front-desk hand-ins", async () => {
    const { world, service } = await setup();
    const id = await service.create(
      { type: "found", title: "Wallet", description: "Brown leather wallet.", category: "accessories", location: "Gate", date: toDateKey(world.now), imageUrl: null, imagePath: null, contact: { type: "front-desk", value: "someone@x.com" } },
      reporter,
    );
    expect((await world.store.get<LostFoundItem>(`lostFound/${id}`))?.contact.value).toBe("");
  });

  it("moves open to claimed to resolved and rejects illegal moves", async () => {
    const { world, service, id } = await setup();
    const get = async () => (await world.store.get<LostFoundItem>(`lostFound/${id}`))!;
    await service.updateStatus(await get(), "claimed");
    expect((await get()).status).toBe("claimed");
    await service.updateStatus(await get(), "open");
    await service.updateStatus(await get(), "resolved");
    expect((await get()).status).toBe("resolved");
    await expect(service.updateStatus(await get(), "open")).rejects.toBeInstanceOf(AppError);
  });

  it("lists filtered pages that still fill up when many items are filtered out", async () => {
    const { service } = await setup();
    const page = await service.list({ query: "", type: "found", category: "all", status: "open" }, undefined, 2);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((i) => i.type === "found" && i.status === "open")).toBe(true);
  });

  it("allows the reporter or a moderator to manage a post, nobody else", () => {
    const item = { reporter };
    expect(canManageItem(item, { id: "u-student2", role: "student", staffRole: null })).toBe(true);
    expect(canManageItem(item, { id: "u-other", role: "student", staffRole: null })).toBe(false);
    expect(canManageItem(item, { id: "u-fac", role: "staff", staffRole: "facilities" })).toBe(true);
    expect(canManageItem(item, { id: "u-fin", role: "staff", staffRole: "finance" })).toBe(false);
    expect(canManageItem(item, null)).toBe(false);
    expect(nextLostFoundStatuses("resolved")).toEqual([]);
  });
});

describe("lost & found form validation", () => {
  const valid: LostFoundInput = {
    type: "lost",
    title: "Black umbrella",
    description: "Left in room A101 after the lecture.",
    category: "other",
    location: "A101",
    date: "2026-01-05",
    imageUrl: null,
    imagePath: null,
    contact: { type: "email", value: "me@ucl.example" },
  };

  it("accepts a complete report", () => {
    expect(lostFoundSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects future dates and impossible dates", () => {
    const future = new Date(Date.now() + 3 * 86_400_000);
    expect(lostFoundSchema.safeParse({ ...valid, date: toDateKey(future) }).success).toBe(false);
    expect(lostFoundSchema.safeParse({ ...valid, date: "2026-13-40" }).success).toBe(false);
  });

  it("requires contact details that match the chosen method", () => {
    expect(lostFoundSchema.safeParse({ ...valid, contact: { type: "email", value: "not-an-email" } }).success).toBe(false);
    expect(lostFoundSchema.safeParse({ ...valid, contact: { type: "phone", value: "abc" } }).success).toBe(false);
    expect(lostFoundSchema.safeParse({ ...valid, contact: { type: "phone", value: "+94 77 123 4567" } }).success).toBe(true);
    expect(lostFoundSchema.safeParse({ ...valid, contact: { type: "front-desk", value: "" } }).success).toBe(true);
  });

  it("requires a title and a description of useful length", () => {
    expect(lostFoundSchema.safeParse({ ...valid, title: "ab" }).success).toBe(false);
    expect(lostFoundSchema.safeParse({ ...valid, description: "short" }).success).toBe(false);
  });
});
