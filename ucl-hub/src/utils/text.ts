/** Text helpers shared by search, filtering and display code. */

/** Lower-cases, strips diacritics and collapses whitespace/punctuation. */
export function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Case-insensitive "all words present" search used by every list filter.
 * An empty query matches everything so filters can be wired unconditionally.
 */
export function matchesQuery(fields: ReadonlyArray<string | null | undefined>, query: string): boolean {
  const words = normalizeText(query).split(" ").filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalizeText(fields.filter(Boolean).join(" "));
  // "wifi" should also find "Wi-Fi": longer words are matched against the text with spaces removed too.
  const compact = haystack.replace(/ /g, "");
  return words.every((word) => haystack.includes(word) || (word.length >= 4 && compact.includes(word)));
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Splits "a, b ,c" into trimmed non-empty unique values. */
export function splitList(value: string): string[] {
  return Array.from(new Set(value.split(",").map((v) => v.trim()).filter(Boolean)));
}

/** Removes control characters and trims. Used before storing free text. */
export function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "in_progress" -> "In progress" */
export function humanize(value: string): string {
  return capitalize(value.replace(/[_-]+/g, " ").trim());
}
