/**
 * Sliding-window rate limiter kept in memory.
 *
 * It protects the AI provider budget from a single noisy user. On serverless
 * hosting each instance keeps its own counters, which is an acceptable
 * approximation for this use; a shared store (Redis/Firestore) would be the
 * next step if strict global limits were required.
 */

export interface RateLimiter {
  /** Returns true when the call is allowed and records it. */
  take(key: string, now?: number): boolean;
}

export function createRateLimiter(limit: number, windowMs: number = 60_000): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    take(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      // Occasionally drop idle keys so the map cannot grow without bound.
      if (hits.size > 5000) {
        for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return true;
    },
  };
}
