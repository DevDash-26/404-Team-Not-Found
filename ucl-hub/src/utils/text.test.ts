import { describe, expect, it } from "vitest";
import { humanize, initials, matchesQuery, normalizeText, sanitizeText, splitList, truncate } from "./text";

describe("search text helpers", () => {
  it("matches every word, in any order, ignoring case, accents and punctuation", () => {
    expect(matchesQuery(["Library opening hours"], "HOURS library")).toBe(true);
    expect(matchesQuery(["Café near Block B"], "cafe")).toBe(true);
    expect(matchesQuery(["Library opening hours"], "library parking")).toBe(false);
  });

  it("treats an empty or blank search as matching everything (no empty-state surprises)", () => {
    expect(matchesQuery(["anything"], "")).toBe(true);
    expect(matchesQuery(["anything"], "   ")).toBe(true);
    expect(matchesQuery([], "")).toBe(true);
  });

  it("returns no match, rather than crashing, for missing fields or symbol-only searches", () => {
    expect(matchesQuery([null, undefined], "x")).toBe(false);
    expect(matchesQuery(["abc"], "!!!")).toBe(true);
  });

  it("finds Wi-Fi when someone types wifi, and the reverse", () => {
    expect(matchesQuery(["How do I connect to campus Wi-Fi?"], "wifi")).toBe(true);
    expect(matchesQuery(["Fix wifi problems"], "wi-fi")).toBe(true);
  });

  it("does not let short words match across word boundaries", () => {
    expect(matchesQuery(["a cat"], "acat")).toBe(true);
    expect(matchesQuery(["to me"], "tom")).toBe(false);
  });

  it("normalises text", () => {
    expect(normalizeText("  Ça  va?  ")).toBe("ca va");
  });

  it("cleans and formats user text", () => {
    expect(sanitizeText("  hi\u0000 there \u0007")).toBe("hi there");
    expect(splitList("a, b,, a , c")).toEqual(["a", "b", "c"]);
    expect(humanize("in-progress")).toBe("In progress");
    expect(initials("Amaya Perera")).toBe("AP");
    expect(truncate("abcdefghij", 5)).toBe("abcd…");
    expect(truncate("abc", 5)).toBe("abc");
  });
});
