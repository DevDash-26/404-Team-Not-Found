"use client";

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import type { Page } from "@/lib/backend/types";
import { toUserMessage } from "@/utils/errors";
import { useDepsKey } from "./useDepsKey";

export interface PagedList<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  reload: () => void;
  /** Applies a local change (optimistic update or removal) without refetching. */
  mutate: (updater: (items: T[]) => T[]) => void;
}

interface State<T> {
  key: object;
  items: T[];
  cursor: unknown | null;
  error: string | null;
  loadingMore: boolean;
}

/**
 * Cursor-paginated list. The first page loads whenever `deps` change; `loadMore`
 * appends the next page. Stale responses (from before a filter change) are dropped.
 */
export function usePagedList<T>(fetchPage: (cursor: unknown | undefined) => Promise<Page<T>>, deps: DependencyList): PagedList<T> {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<State<T> | null>(null);
  const busy = useRef(false);

  const key = useDepsKey(deps, version);

  useEffect(() => {
    let cancelled = false;
    busy.current = false;
    fetchPage(undefined).then(
      (page) => {
        if (!cancelled) setState({ key, items: page.items, cursor: page.nextCursor, error: null, loadingMore: false });
      },
      (error: unknown) => {
        if (!cancelled) setState({ key, items: [], cursor: null, error: toUserMessage(error), loadingMore: false });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state !== null && state.key === key ? state : null;
  const cursor = current?.cursor ?? null;

  const loadMore = useCallback(() => {
    if (!current || cursor === null || busy.current) return;
    busy.current = true;
    setState({ ...current, loadingMore: true });
    fetchPage(cursor).then(
      (page) => setState((s) => (s && s.key === key ? { ...s, items: [...s.items, ...page.items], cursor: page.nextCursor, loadingMore: false } : s)),
      (error: unknown) => setState((s) => (s && s.key === key ? { ...s, error: toUserMessage(error), loadingMore: false } : s)),
    ).finally(() => {
      busy.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, cursor, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const mutate = useCallback((updater: (items: T[]) => T[]) => {
    setState((s) => (s ? { ...s, items: updater(s.items) } : s));
  }, []);

  return {
    items: current?.items ?? [],
    loading: current === null,
    loadingMore: current?.loadingMore ?? false,
    hasMore: cursor !== null,
    error: current?.error ?? null,
    loadMore,
    reload,
    mutate,
  };
}
