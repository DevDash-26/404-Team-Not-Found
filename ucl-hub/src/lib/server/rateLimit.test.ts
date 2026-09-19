import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rateLimit";

describe("rate limiter", () => {
  it("allows up to the limit inside the window, then refuses", () => {
    const limiter = createRateLimiter(3, 60_000);
    expect([1, 2, 3, 4].map(() => limiter.take("u1", 1000))).toEqual([true, true, true, false]);
  });

  it("counts each person separately", () => {
    const limiter = createRateLimiter(1, 60_000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("b", 0)).toBe(true);
    expect(limiter.take("a", 1)).toBe(false);
  });

  it("lets people back in once the window has passed", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("a", 500)).toBe(false);
    expect(limiter.take("a", 1001)).toBe(true);
  });

  it("does not count refused requests against the person", () => {
    const limiter = createRateLimiter(1, 1000);
    limiter.take("a", 0);
    limiter.take("a", 100);
    limiter.take("a", 200);
    expect(limiter.take("a", 1001)).toBe(true);
  });
});
