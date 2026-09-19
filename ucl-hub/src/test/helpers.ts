/** Shared fixtures for unit tests: a memory store filled with the realistic demo dataset. */

import { buildDemoData, type DemoData } from "@/data/demo";
import { MemoryStore } from "@/lib/backend/memory/memoryStore";
import { fixedClock, type Clock } from "@/utils/clock";

/** A Wednesday morning, so "this week", "tomorrow" and weekend logic are predictable. */
export const TEST_NOW = new Date(2026, 8, 16, 10, 0, 0);

export interface TestWorld {
  now: Date;
  clock: Clock;
  demo: DemoData;
  store: MemoryStore;
}

export function createTestWorld(now: Date = TEST_NOW): TestWorld {
  const demo = buildDemoData(now);
  return { now, clock: fixedClock(now), demo, store: new MemoryStore(demo.collections) };
}
