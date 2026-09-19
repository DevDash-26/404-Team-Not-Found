import { PAGINATION } from "@/config/app";
import type { Page } from "@/lib/backend/types";

interface FilteredPageOptions<T> {
  fetchPage: (cursor: unknown | undefined) => Promise<Page<T>>;
  predicate: (item: T) => boolean;
  /** Minimum number of matching items we would like to return. */
  target: number;
  cursor?: unknown;
  maxPages?: number;
}

/**
 * Fetches pages until at least `target` items pass `predicate` (or the data
 * runs out / the page budget is spent). Used when a filter that Firestore
 * cannot express without a composite index is applied on the client, so a
 * page never looks empty just because its first batch was filtered away.
 */
export async function fetchFilteredPage<T>({
  fetchPage,
  predicate,
  target,
  cursor,
  maxPages = PAGINATION.maxAutoFetchPages,
}: FilteredPageOptions<T>): Promise<Page<T>> {
  const items: T[] = [];
  let next: unknown | null = cursor ?? null;
  let pages = 0;
  let first = true;

  while (first || (items.length < target && next && pages < maxPages)) {
    first = false;
    const page = await fetchPage(next ?? undefined);
    items.push(...page.items.filter(predicate));
    next = page.nextCursor;
    pages += 1;
    if (!next) break;
  }
  return { items, nextCursor: next };
}

/** Reads every page of a query (bounded) and returns all items. */
export async function readAllPages<T>(
  fetchPage: (cursor: unknown | undefined) => Promise<Page<T>>,
  maxPages = 10,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: unknown | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await fetchPage(cursor ?? undefined);
    items.push(...result.items);
    cursor = result.nextCursor;
    if (!cursor) break;
  }
  return items;
}
