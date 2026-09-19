/**
 * BM25 ranking over knowledge documents, plus intent and time-window boosts.
 *
 * The corpus is small (a few hundred documents), so the index is built per
 * query. That keeps the retrieval layer stateless and always consistent with
 * the data it was given.
 */

import { AI } from "@/config/app";
import { boostFor } from "./intents";
import { expandQuery, tokenize } from "./text";
import { overlapsWindow } from "./temporal";
import type { Intent, KnowledgeDocument, TimeWindow } from "../types";

const BM25_K1 = 1.2;
const BM25_B = 0.75;
const TITLE_WEIGHT = 3;
const KEYWORD_WEIGHT = 2;
const IN_WINDOW_BOOST = 1.6;
const OUT_OF_WINDOW_PENALTY = 0.25;
const ALL_TERMS_IN_TITLE_BOOST = 1.2;

export interface ScoredDocument {
  doc: KnowledgeDocument;
  score: number;
}

export interface SearchOptions {
  limit?: number;
  intents?: Intent[];
  window?: TimeWindow | null;
}

interface IndexedDocument {
  doc: KnowledgeDocument;
  termFrequency: Map<string, number>;
  titleTerms: Set<string>;
  length: number;
}

function indexDocument(doc: KnowledgeDocument): IndexedDocument {
  const termFrequency = new Map<string, number>();
  let length = 0;
  const add = (terms: string[], weight: number) => {
    for (const term of terms) {
      termFrequency.set(term, (termFrequency.get(term) ?? 0) + weight);
      length += weight;
    }
  };
  const titleTokens = tokenize(doc.title);
  add(titleTokens, TITLE_WEIGHT);
  add(doc.keywords.flatMap(tokenize), KEYWORD_WEIGHT);
  add(tokenize(doc.text), 1);
  return { doc, termFrequency, titleTerms: new Set(titleTokens), length };
}

export function searchKnowledge(
  docs: KnowledgeDocument[],
  query: string,
  { limit = AI.contextDocs, intents = [], window = null }: SearchOptions = {},
): ScoredDocument[] {
  const queryTerms = expandQuery(query);
  if (queryTerms.size === 0 || docs.length === 0) return [];

  const indexed = docs.map(indexDocument);
  const averageLength = indexed.reduce((sum, d) => sum + d.length, 0) / indexed.length || 1;

  const documentFrequency = new Map<string, number>();
  for (const term of queryTerms.keys()) {
    documentFrequency.set(term, indexed.filter((d) => d.termFrequency.has(term)).length);
  }

  const directTerms = [...queryTerms.entries()].filter(([, weight]) => weight === 1).map(([term]) => term);
  const scored: ScoredDocument[] = [];

  for (const item of indexed) {
    let score = 0;
    let directMatches = 0;

    for (const [term, queryWeight] of queryTerms) {
      const tf = item.termFrequency.get(term);
      if (!tf) continue;
      const df = documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (indexed.length - df + 0.5) / (df + 0.5));
      const norm = tf + BM25_K1 * (1 - BM25_B + (BM25_B * item.length) / averageLength);
      score += queryWeight * idf * ((tf * (BM25_K1 + 1)) / norm);
      if (queryWeight === 1) directMatches += 1;
    }
    // Matches that only came from synonyms are too weak to trust on their own.
    if (score === 0 || directMatches === 0) continue;

    score *= boostFor(intents, item.doc.kind);

    if (window && (item.doc.kind === "event" || item.doc.kind === "calendar")) {
      score *= overlapsWindow(item.doc.startsAt, item.doc.endsAt, window) ? IN_WINDOW_BOOST : OUT_OF_WINDOW_PENALTY;
    }
    if (directTerms.length > 0 && directTerms.every((term) => item.titleTerms.has(term))) {
      score *= ALL_TERMS_IN_TITLE_BOOST;
    }
    scored.push({ doc: item.doc, score });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0]?.score ?? 0;
  return scored
    .filter((entry) => entry.score >= AI.minScore && entry.score >= top * AI.relativeCutoff)
    .slice(0, limit);
}
