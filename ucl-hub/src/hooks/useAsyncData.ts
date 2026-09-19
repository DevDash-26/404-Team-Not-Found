"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";
import { toUserMessage } from "@/utils/errors";
import { useDepsKey } from "./useDepsKey";

export interface AsyncData<T> {
  data: T | null;
  /** True only on the first load, before any data has arrived. */
  loading: boolean;
  /** True whenever a request is in flight, including reloads that keep showing old data. */
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  /** Replaces the data locally (for optimistic updates). */
  setData: (updater: (current: T | null) => T | null) => void;
}

interface Settled<T> {
  key: object;
  data: T | null;
  error: string | null;
}

/**
 * Runs an async loader whenever `deps` change (or `reload()` is called) and
 * exposes loading / error / data. Results of superseded requests are ignored,
 * so a slow earlier request can never overwrite a newer one.
 */
export function useAsyncData<T>(load: () => Promise<T>, deps: DependencyList): AsyncData<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  const key = useDepsKey(deps, version);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => {
        if (!cancelled) setSettled({ key, data, error: null });
      },
      (error: unknown) => {
        if (!cancelled) setSettled((previous) => ({ key, data: previous?.data ?? null, error: toUserMessage(error) }));
      },
    );
    return () => {
      cancelled = true;
    };
    // `load` is intentionally not a dependency: callers pass an inline function and list what it depends on in `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((updater: (current: T | null) => T | null) => {
    setSettled((previous) => ({ key: previous?.key ?? {}, data: updater(previous?.data ?? null), error: null }));
  }, []);

  const current = settled?.key === key;
  return {
    data: settled?.data ?? null,
    loading: settled === null || (!current && settled.data === null),
    refreshing: !current,
    error: current ? settled.error : null,
    reload,
    setData,
  };
}
