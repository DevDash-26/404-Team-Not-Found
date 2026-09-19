"use client";

import { useEffect, useState } from "react";

/** The current time, refreshed every `intervalMs`, so "starts in 2 hours" labels stay accurate. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
