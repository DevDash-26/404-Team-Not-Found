/** Injectable clock so time-dependent logic can be tested deterministically. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export function fixedClock(date: Date): Clock {
  return { now: () => new Date(date.getTime()) };
}

export function nowIso(clock: Clock = systemClock): string {
  return clock.now().toISOString();
}
