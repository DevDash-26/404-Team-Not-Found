import { describe, expect, it } from "vitest";
import type { Page } from "@/lib/backend/types";
import { fetchFilteredPage, readAllPages } from "./paging";

function pagesOf(all: number[], size: number): (cursor: unknown | undefined) => Promise<Page<number>> {
  return async (cursor) => {
    const start = typeof cursor === "number" ? cursor : 0;
    const items = all.slice(start, start + size);
    const next = start + size < all.length ? start + size : null;
    return { items, nextCursor: next };
  };
}

describe("paging helpers", () => {
  const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

  it("keeps fetching until a filtered page has enough matches", async () => {
    const page = await fetchFilteredPage({ fetchPage: pagesOf(numbers, 5), predicate: (n) => n % 10 === 0, target: 2 });
    expect(page.items).toEqual([10, 20]);
    expect(page.nextCursor).not.toBeNull();
  });

  it("continues from a cursor without repeating items", async () => {
    const fetchPage = pagesOf(numbers, 5);
    const first = await fetchFilteredPage({ fetchPage, predicate: (n) => n % 2 === 0, target: 4 });
    const second = await fetchFilteredPage({ fetchPage, predicate: (n) => n % 2 === 0, target: 4, cursor: first.nextCursor ?? undefined });
    // `target` is a minimum: whole pages are kept, so nothing that was fetched is thrown away.
    expect(first.items).toEqual([2, 4, 6, 8, 10]);
    expect(second.items[0]).toBe(12);
  });

  it("stops at the end of the data and reports no more pages", async () => {
    const page = await fetchFilteredPage({ fetchPage: pagesOf(numbers, 10), predicate: (n) => n > 25, target: 10 });
    expect(page.items).toEqual([26, 27, 28, 29, 30]);
    expect(page.nextCursor).toBeNull();
  });

  it("gives up after the page budget so a rare filter cannot read the whole collection", async () => {
    let calls = 0;
    const fetchPage = async (cursor: unknown | undefined) => {
      calls += 1;
      return pagesOf(numbers, 1)(cursor);
    };
    const page = await fetchFilteredPage({ fetchPage, predicate: () => false, target: 5, maxPages: 3 });
    expect(calls).toBe(3);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).not.toBeNull();
  });

  it("returns an empty page for an empty collection", async () => {
    const page = await fetchFilteredPage({ fetchPage: pagesOf([], 5), predicate: () => true, target: 5 });
    expect(page).toEqual({ items: [], nextCursor: null });
  });

  it("reads every page up to a limit", async () => {
    expect(await readAllPages(pagesOf(numbers, 7))).toEqual(numbers);
    expect(await readAllPages(pagesOf(numbers, 7), 2)).toHaveLength(14);
  });
});
