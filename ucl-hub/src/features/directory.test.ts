import { describe, expect, it } from "vitest";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import { validate } from "@/lib/validation";
import { groupFaqs, searchFaqs } from "./faq/logic";
import { faqSchema } from "./faq/schema";
import { createFaqService } from "./faq/service";
import { departments, filterServices, filterStaff, summariseHours } from "./services/logic";
import { serviceSchema, staffContactSchema } from "./services/schema";
import { createServiceDirectoryService } from "./services/service";
import { filterSocieties, newActivities, upcomingActivities } from "./societies/logic";
import { societySchema } from "./societies/schema";
import { createSocietyService } from "./societies/service";
import { toIso } from "@/utils/dates";

describe("FAQ search and categories", () => {
  async function faqs() {
    const world = createTestWorld();
    return createFaqService(world.store, world.clock).listAll();
  }

  it("has a useful set of FAQs in several categories", async () => {
    const items = await faqs();
    expect(items).toHaveLength(4);
    expect(new Set(items.map((f) => f.category)).size).toBe(2);
  });

  it("searches question and answer text, case-insensitively", async () => {
    const items = await faqs();
    const hits = searchFaqs(items, "WIFI", "all");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((f) => /wi-?fi|wifi/i.test(`${f.question} ${f.answer}`))).toBe(true);
  });

  it("returns nothing for a search with no matches and everything for an empty search", async () => {
    const items = await faqs();
    expect(searchFaqs(items, "qzxjv", "all")).toEqual([]);
    expect(searchFaqs(items, "  ", "all")).toHaveLength(items.length);
  });

  it("combines the category filter with the search", async () => {
    const items = await faqs();
    expect(searchFaqs(items, "", "finance").every((f) => f.category === "finance")).toBe(true);
  });

  it("groups by category and keeps the editorial order", async () => {
    const groups = groupFaqs(await faqs());
    for (const group of groups) {
      const orders = group.faqs.map((f) => f.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    }
  });

  it("validates the staff form", () => {
    const valid = { question: "Where is the registrar?", answer: "Block A, ground floor.", category: "academic", order: 1 };
    expect(validate(faqSchema, valid).ok).toBe(true);
    expect(validate(faqSchema, { ...valid, question: "Hi" }).ok).toBe(false);
    expect(validate(faqSchema, { ...valid, order: -1 }).ok).toBe(false);
  });
});

describe("campus services and staff directory", () => {
  it("finds the library and shows its opening hours, location and contact", async () => {
    const world = createTestWorld();
    const services = await createServiceDirectoryService(world.store, world.clock).listServices();
    const library = filterServices(services, "library", "all")[0];
    expect(library).toBeDefined();
    expect(library?.location).toBeTruthy();
    expect(summariseHours(library!)).toMatch(/Mon/);
    expect(library?.email || library?.phone).toBeTruthy();
  });

  it("filters services by category", async () => {
    const world = createTestWorld();
    const services = await createServiceDirectoryService(world.store, world.clock).listServices();
    expect(filterServices(services, "", "it").every((s) => s.category === "it")).toBe(true);
    expect(filterServices(services, "zzzz", "all")).toEqual([]);
  });

  it("finds the right contact by topic (for example finance)", async () => {
    const world = createTestWorld();
    const staff = await createServiceDirectoryService(world.store, world.clock).listStaff();
    const hits = filterStaff(staff, "fees", "all");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((c) => /finance/i.test(c.department))).toBe(true);
    expect(departments(staff).length).toBeGreaterThan(2);
    expect(filterStaff(staff, "", "no such department")).toEqual([]);
  });

  it("validates service and contact forms", () => {
    const service = { name: "Print Shop", category: "printing", description: "Printing and binding for students.", location: "Block B", openingHours: [{ days: "Mon-Fri", hours: "9-5" }], email: "", phone: "", links: [] };
    expect(validate(serviceSchema, service).ok).toBe(true);
    expect(validate(serviceSchema, { ...service, openingHours: [] }).ok).toBe(false);
    expect(validate(serviceSchema, { ...service, phone: "call me" }).ok).toBe(false);
    expect(validate(serviceSchema, { ...service, links: [{ label: "Site", url: "ftp://x" }] }).ok).toBe(false);
    expect(validate(staffContactSchema, { name: "Ms. Silva", title: "Bursar", department: "Finance", email: "silva@ucl.example", phone: "", office: "", topics: ["fees"] }).ok).toBe(true);
    expect(validate(staffContactSchema, { name: "Ms. Silva", title: "Bursar", department: "Finance", email: "nope", phone: "", office: "", topics: [] }).ok).toBe(false);
  });
});

describe("societies", () => {
  const actor = { id: "u-society", name: "Dilan" };

  it("filters by category and search text (including committee names)", async () => {
    const world = createTestWorld();
    const list = await createSocietyService(world.store, world.clock).listAll();
    expect(list.length).toBeGreaterThanOrEqual(6);
    expect(filterSocieties(list, { query: "", category: "sports" }).every((s) => s.category === "sports")).toBe(true);
    expect(filterSocieties(list, { query: "qzxj", category: "all" })).toEqual([]);
  });

  it("records interest once, counts it, and lets a student withdraw", async () => {
    const world = createTestWorld();
    const service = createSocietyService(world.store, world.clock);
    const society = (await service.listAll())[0]!;
    const student = { id: "u-new-student", name: "Amaya" };
    await service.expressInterest(society, student, "I'd love to join");
    await service.expressInterest(society, student, "again");
    expect((await service.get(society.id))?.interestCount).toBe(society.interestCount + 1);
    expect((await service.getMyInterestIds(student.id)).has(society.id)).toBe(true);
    expect((await service.listInterests(society.id)).items.filter((i) => i.userId === student.id)).toHaveLength(1);
    await service.withdrawInterest((await service.get(society.id))!, student);
    expect((await service.get(society.id))?.interestCount).toBe(society.interestCount);
  });

  it("notifies students only about newly added activities", async () => {
    const world = createTestWorld();
    const service = createSocietyService(world.store, world.clock);
    const society = (await service.get("soc-computing"))!;
    const before = await world.store.count("notifications", [{ field: "type", op: "==", value: "society" }]);
    const extra = { title: "Hack night", date: toIso(new Date(TEST_NOW.getTime() + 3 * 86_400_000)), location: "Lab" };
    const { id: _id, interestCount: _count, createdAt: _created, ...rest } = society;
    await service.update(society.id, { ...rest, activities: [...society.activities, extra] }, actor);
    expect(await world.store.count("notifications", [{ field: "type", op: "==", value: "society" }])).toBe(before + 1);
    // Saving again with no new activity sends nothing.
    const again = (await service.get(society.id))!;
    await service.update(society.id, { ...rest, activities: again.activities }, actor);
    expect(await world.store.count("notifications", [{ field: "type", op: "==", value: "society" }])).toBe(before + 1);
  });

  it("works out upcoming and new activities", () => {
    const a = { title: "Past", date: "2026-09-01T10:00:00Z", location: "X" };
    const b = { title: "Next", date: "2026-09-20T10:00:00Z", location: "X" };
    expect(upcomingActivities({ activities: [b, a] }, TEST_NOW)).toEqual([b]);
    expect(newActivities([a], [a, b])).toEqual([b]);
  });

  it("validates the committee form", () => {
    const valid = { name: "Chess Club", description: "Weekly chess and tournaments.", category: "community", colour: "#123abc", contactEmail: "chess@ucl.example", committee: [{ role: "President", name: "Nimal", email: "nimal@ucl.example" }], activities: [], memberCount: 12, logoUrl: null, logoPath: null };
    expect(validate(societySchema, valid).ok).toBe(true);
    expect(validate(societySchema, { ...valid, colour: "blue" }).ok).toBe(false);
    expect(validate(societySchema, { ...valid, committee: [{ role: "P", name: "N", email: "bad" }] }).ok).toBe(false);
    expect(validate(societySchema, { ...valid, memberCount: -3 }).ok).toBe(false);
  });
});
