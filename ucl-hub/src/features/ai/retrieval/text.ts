/**
 * Text analysis for retrieval: normalisation, a light stemmer, stop words and
 * a small synonym table tuned for campus vocabulary.
 */

import { normalizeText } from "@/utils/text";

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "from", "by", "with", "about",
  "is", "are", "was", "were", "be", "been", "am", "do", "does", "did", "can", "could", "should", "would",
  "will", "shall", "may", "might", "i", "me", "my", "we", "our", "you", "your", "it", "its", "this", "that",
  "these", "those", "what", "which", "who", "whom", "when", "where", "why", "how", "there", "any", "some",
  "please", "tell", "know", "want", "need", "get", "have", "has", "had", "if", "so", "as", "up", "out",
  "much", "many", "im", "ive", "s", "t", "next", "current", "currently",
]);

/** Query words that should also match these related campus words (keys are stemmed). */
const SYNONYMS: Record<string, string[]> = {
  intern: ["internship", "job", "placement"],
  internship: ["job", "placement", "intern"],
  vacancy: ["job"],
  career: ["job", "internship"],
  ac: ["air", "condition", "maintenance"],
  aircon: ["air", "condition", "maintenance"],
  conditioner: ["condition", "air"],
  fee: ["finance", "payment", "tuition"],
  tuition: ["fee", "finance", "payment"],
  scholarship: ["finance", "bursary"],
  pay: ["payment", "finance", "fee"],
  wifi: ["network", "internet"],
  internet: ["wifi", "network"],
  password: ["account", "reset"],
  counsel: ["wellbeing", "counselling", "mental", "health"],
  counselling: ["wellbeing", "mental", "health"],
  counsellor: ["wellbeing", "counselling"],
  stress: ["wellbeing", "counselling"],
  anxiety: ["wellbeing", "counselling"],
  lunch: ["canteen", "dining"],
  food: ["canteen", "dining"],
  eat: ["canteen", "dining"],
  cafeteria: ["canteen", "dining"],
  coffee: ["cafe", "dining"],
  print: ["printing", "copy"],
  photocopy: ["print", "copy"],
  gym: ["sport", "recreation"],
  swimming: ["sport", "pool"],
  exam: ["examination", "test"],
  test: ["exam", "examination"],
  holiday: ["closed", "poya"],
  register: ["registration", "enrol"],
  enrol: ["registration", "register"],
  book: ["booking", "reserve"],
  reserve: ["book", "booking"],
  classroom: ["room", "study"],
  room: ["classroom"],
  lost: ["found", "missing"],
  missing: ["lost", "found"],
  broken: ["repair", "maintenance", "issue", "report"],
  leak: ["plumbing", "maintenance", "report"],
  fix: ["repair", "maintenance", "report"],
  library: ["book", "borrow"],
  term: ["semester"],
  begin: ["start"],
  start: ["begin"],
};

/** Preprocessing so "Wi-Fi", "a/c" and "A.C." become single tokens. */
function preprocess(input: string): string {
  return input
    .replace(/wi[\s-]?fi/gi, "wifi")
    .replace(/\ba\s*\/\s*c\b/gi, "ac")
    .replace(/\ba\.c\.?/gi, "ac")
    .replace(/e[\s-]?mail/gi, "email");
}

/**
 * A deliberately small stemmer. It only needs to map the common inflections of
 * campus vocabulary (close/closes/closing, book/booking/books) to one form,
 * applied identically to documents and queries.
 */
export function stem(word: string): string {
  let w = word;
  if (w.length > 4 && w.endsWith("ies")) return `${w.slice(0, -3)}y`;
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith("es")) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

/** Normalised, stemmed tokens with stop words removed. */
export function tokenize(input: string): string[] {
  return normalizeText(preprocess(input))
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .map(stem);
}

/** Query terms with weights: the user's own words count fully, synonyms a bit less. */
export function expandQuery(query: string): Map<string, number> {
  const weights = new Map<string, number>();
  for (const token of tokenize(query)) {
    weights.set(token, Math.max(weights.get(token) ?? 0, 1));
    for (const synonym of SYNONYMS[token] ?? []) {
      const stemmed = stem(synonym);
      weights.set(stemmed, Math.max(weights.get(stemmed) ?? 0, 0.45));
    }
  }
  return weights;
}

/** Lower-cased, punctuation-stripped words of a query, before stemming (for intent regexes). */
export function plainQuery(query: string): string {
  return normalizeText(preprocess(query));
}
