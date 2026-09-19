/**
 * Backend factory. Callers do `const { store } = await getBackend()` and never
 * import Firebase (or the memory adapter) directly. Adapters are loaded lazily
 * so the unused one is never bundled into a page's critical path.
 */

import { backendMode } from "@/config/env";
import type { Backend } from "./types";

let backendPromise: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise =
      backendMode === "memory"
        ? import("./memory/memoryBackend").then((m) => m.createMemoryBackend())
        : import("./firebase/firebaseBackend").then((m) => m.createFirebaseBackend());
  }
  return backendPromise;
}

export type { Backend } from "./types";
