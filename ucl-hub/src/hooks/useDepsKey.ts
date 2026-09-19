"use client";

import { useState, type DependencyList } from "react";

interface Tracked {
  deps: DependencyList;
  version: number;
  key: object;
}

function same(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}

/**
 * Returns an object whose identity changes whenever `deps` or `version` change.
 * Data hooks store results together with the key that requested them, so
 * "is this result for the current inputs?" is a plain identity comparison.
 */
export function useDepsKey(deps: DependencyList, version: number): object {
  const [tracked, setTracked] = useState<Tracked>({ deps, version, key: {} });
  if (tracked.version !== version || !same(tracked.deps, deps)) {
    // Derived state: React re-renders immediately with the new key (no effect needed).
    const next = { deps, version, key: {} };
    setTracked(next);
    return next.key;
  }
  return tracked.key;
}
