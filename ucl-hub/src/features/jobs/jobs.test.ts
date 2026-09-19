import { describe, expect, it } from "vitest";
import { createTestWorld, TEST_NOW } from "@/test/helpers";
import type { Job } from "@/types";
import { validate } from "@/lib/validation";
import { allSkills, DEFAULT_JOB_FILTERS, daysLeft, filterJobs, isJobOpen, sortJobs } from "./logic";
import { jobSchema } from "./schema";
import { createJobService } from "./service";

const job = (over: Partial<Job>): Job => ({
  id: "j",
  company: "Acme",
  position: "Intern",
  description: "Work on things",
  location: "Colombo",
  type: "internship",
  deadline: "2026-09-30",
  applyUrl: "https://acme.example/apply",
  skills: ["React"],
  createdAt: "2026-09-01T00:00:00Z",
  ...over,
});

describe("jobs and internships", () => {
  const jobs = [
    job({ id: "open-soon", deadline: "2026-09-20", skills: ["React", "TypeScript"], position: "Frontend Intern" }),
    job({ id: "open-later", deadline: "2026-10-30", type: "graduate", location: "Kandy", skills: ["Python", "SQL"], position: "Data Analyst" }),
    job({ id: "today", deadline: "2026-09-16", type: "part-time", skills: ["Excel"] }),
    job({ id: "closed", deadline: "2026-09-10", skills: ["React"] }),
  ];

  it("keeps a job open until the end of its deadline day", () => {
    expect(isJobOpen({ deadline: "2026-09-16" }, TEST_NOW)).toBe(true);
    expect(isJobOpen({ deadline: "2026-09-15" }, TEST_NOW)).toBe(false);
    expect(isJobOpen({ deadline: "garbage" }, TEST_NOW)).toBe(false);
    expect(daysLeft({ deadline: "2026-09-19" }, TEST_NOW)).toBe(3);
  });

  it("hides closed listings by default and shows them on request", () => {
    expect(filterJobs(jobs, DEFAULT_JOB_FILTERS, TEST_NOW).map((j) => j.id)).not.toContain("closed");
    expect(filterJobs(jobs, { ...DEFAULT_JOB_FILTERS, openOnly: false }, TEST_NOW).map((j) => j.id)).toContain("closed");
  });

  it("filters by type, location, skill and free text", () => {
    const f = { ...DEFAULT_JOB_FILTERS, openOnly: false };
    expect(filterJobs(jobs, { ...f, type: "graduate" }, TEST_NOW).map((j) => j.id)).toEqual(["open-later"]);
    expect(filterJobs(jobs, { ...f, location: "kandy" }, TEST_NOW).map((j) => j.id)).toEqual(["open-later"]);
    expect(filterJobs(jobs, { ...f, skill: "react" }, TEST_NOW).map((j) => j.id)).toEqual(["open-soon", "closed"]);
    expect(filterJobs(jobs, { ...f, query: "analyst" }, TEST_NOW).map((j) => j.id)).toEqual(["open-later"]);
    expect(filterJobs(jobs, { ...f, query: "no match" }, TEST_NOW)).toEqual([]);
  });

  it("puts the soonest deadlines first and closed listings last", () => {
    expect(sortJobs(jobs, TEST_NOW).map((j) => j.id)).toEqual(["today", "open-soon", "open-later", "closed"]);
  });

  it("lists the distinct skills for the filter", () => {
    expect(allSkills(jobs)).toEqual(["Excel", "Python", "React", "SQL", "TypeScript"]);
  });

  it("serves the demo listings and lets staff add one", async () => {
    const world = createTestWorld();
    const service = createJobService(world.store, world.clock);
    const before = (await service.list(undefined, 100)).items.length;
    const id = await service.create({ company: "Zed", position: "QA Intern", description: "Test our apps thoroughly.", location: "Remote", type: "internship", deadline: "2026-12-01", applyUrl: "https://zed.example", skills: ["Testing"] }, { id: "u-academic", name: "Dr N" });
    const after = await service.list(undefined, 100);
    expect(after.items.length).toBe(before + 1);
    expect(after.items.some((j) => j.id === id)).toBe(true);
  });

  it("validates listing forms", () => {
    const valid = { company: "Zed", position: "QA Intern", description: "Test our apps thoroughly.", location: "Remote", type: "internship", deadline: "2026-12-01", applyUrl: "https://zed.example", skills: ["Testing"] };
    expect(validate(jobSchema, valid).ok).toBe(true);
    expect(validate(jobSchema, { ...valid, applyUrl: "zed.example" }).ok).toBe(false);
    expect(validate(jobSchema, { ...valid, applyUrl: "javascript:alert(1)" }).ok).toBe(false);
    expect(validate(jobSchema, { ...valid, deadline: "2026-02-31" }).ok).toBe(false);
    expect(validate(jobSchema, { ...valid, skills: Array.from({ length: 13 }, (_, i) => `s${i}`) }).ok).toBe(false);
  });
});
