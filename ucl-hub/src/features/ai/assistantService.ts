/**
 * Orchestrates one assistant turn:
 *
 *   validate → understand (intents, time window) → retrieve → generate → package
 *
 * The service is framework-free and receives its collaborators (knowledge
 * loader, provider, clock), so it runs identically in the API route, in memory
 * mode and in unit tests.
 */

import { AI } from "@/config/app";
import { targetOf, type TargetProfile } from "@/lib/audience";
import { AppError } from "@/utils/errors";
import { systemClock, type Clock } from "@/utils/clock";
import { buildKnowledgeDocuments } from "./knowledge/builders";
import type { KnowledgeLoader } from "./knowledge/collect";
import { buildMessages, buildSystemPrompt, sanitizeForPrompt } from "./prompt";
import { NO_ANSWER_MESSAGE } from "./providers/extractive";
import { mockProvider, type AiProvider } from "./providers";
import { detectIntents } from "./retrieval/intents";
import { searchKnowledge } from "./retrieval/search";
import { parseTimeWindow } from "./retrieval/temporal";
import type { AssistantAction, AssistantProfile, AssistantResponse, AssistantSource, ChatTurn, Intent, KnowledgeDocument, KnowledgeKind } from "./types";

const MAX_SOURCES = 3;
const MAX_ACTIONS = 3;
/** Questions this short are treated as follow-ups ("and on Friday?") and get the previous question as context. */
const FOLLOW_UP_MAX_WORDS = 4;
/** Words that mark a short message as a continuation ("and tomorrow?", "what about the library?"). */
const FOLLOW_UP_CUES = /\b(and|also|else|more|too|then|that|those|them|it|there|why|how about|what about|tomorrow|today|tonight|weekend|next week|this week|next month|instead)\b/i;

const KIND_LABEL: Record<KnowledgeKind, string> = {
  announcement: "Announcements",
  event: "Events",
  faq: "FAQs",
  service: "Campus services",
  staff: "Staff directory",
  job: "Jobs & internships",
  calendar: "Academic calendar",
  room: "Classrooms",
  society: "Societies",
  guide: "Open the page",
  note: "Read more",
};

const FALLBACK_ACTIONS: AssistantAction[] = [
  { label: "Send feedback", href: "/feedback" },
  { label: "Staff directory", href: "/staff-directory" },
];

export interface AssistantRequest {
  message: string;
  history?: ChatTurn[];
  profile: AssistantProfile;
}

export interface AssistantDeps {
  knowledge: KnowledgeLoader;
  provider: AiProvider;
  clock?: Clock;
}

/** Validates and normalises the user's message. Throws a user-friendly validation error. */
export function cleanQuestion(message: string): string {
  const cleaned = message.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) throw new AppError("validation", "Type a question first.");
  if (cleaned.length > AI.maxQuestionChars) {
    throw new AppError("validation", `Please keep questions under ${AI.maxQuestionChars} characters.`);
  }
  return cleaned;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * The text used for retrieval. A short message that reads like a follow-up is
 * combined with the previous user question so "what about tomorrow?" still finds events.
 */
export function retrievalQuery(question: string, history: ChatTurn[]): string {
  // Only genuine follow-ups borrow the previous question; a short unrelated or
  // nonsense message must not inherit an old topic and produce a confident wrong answer.
  if (wordCount(question) > FOLLOW_UP_MAX_WORDS || !FOLLOW_UP_CUES.test(question)) return question;
  const previous = [...history].reverse().find((turn) => turn.role === "user");
  return previous ? `${previous.content} ${question}` : question;
}

/** Dedicated pages are labelled by name so two buttons never read the same. */
const ROUTE_LABEL: Record<string, string> = {
  "/library": "Library",
  "/it-support": "IT support",
  "/wellbeing": "Wellbeing support",
};

function dedupeActions(actions: AssistantAction[]): AssistantAction[] {
  const seenHref = new Set<string>();
  const seenLabel = new Set<string>();
  return actions
    .filter((action) => {
      if (seenHref.has(action.href) || seenLabel.has(action.label)) return false;
      seenHref.add(action.href);
      seenLabel.add(action.label);
      return true;
    })
    .slice(0, MAX_ACTIONS);
}

function actionsFor(intents: Intent[], documents: KnowledgeDocument[]): AssistantAction[] {
  const fromIntents = intents.flatMap((intent) => intent.actions);
  const fromDocuments = documents
    .filter((doc) => doc.href.startsWith("/"))
    .slice(0, 2)
    .map((doc) => ({ label: ROUTE_LABEL[doc.href] ?? KIND_LABEL[doc.kind], href: doc.href }));
  return dedupeActions([...fromIntents, ...fromDocuments]);
}

function sourcesFor(documents: KnowledgeDocument[]): AssistantSource[] {
  return documents.slice(0, MAX_SOURCES).map((doc) => ({ title: doc.title, href: doc.href, kind: doc.kind }));
}

export function createAssistantService({ knowledge, provider, clock = systemClock }: AssistantDeps) {
  return {
    async answer({ message, history = [], profile }: AssistantRequest): Promise<AssistantResponse> {
      const question = cleanQuestion(message);
      const now = clock.now();

      const raw = await knowledge.load(now);
      // Staff and administrators are not audience-targeted, so they see everything.
      const target: TargetProfile | null =
        profile.role === "student" ? targetOf({ faculty: profile.faculty, programme: profile.programme, year: profile.year }) : null;
      const documents = buildKnowledgeDocuments(raw, target, now);

      const query = retrievalQuery(question, history);
      const intents = detectIntents(query);
      const window = parseTimeWindow(query, now);
      const results = searchKnowledge(documents, query, { intents, window });
      const matched = results.map((result) => result.doc);

      if (matched.length === 0) {
        // Nothing relevant: answer honestly without spending a model call.
        return {
          answer: NO_ANSWER_MESSAGE,
          sources: [],
          actions: dedupeActions([...intents.flatMap((intent) => intent.actions), ...FALLBACK_ACTIONS]),
          answered: false,
          provider: provider.name,
          degraded: false,
        };
      }

      const input = {
        system: buildSystemPrompt(profile, now),
        messages: buildMessages(history, question, matched),
        documents: matched,
        question: sanitizeForPrompt(question, AI.maxQuestionChars),
        intents,
        window,
        now,
        maxTokens: AI.maxOutputTokens,
      };

      let answer: string;
      let usedProvider = provider.name;
      let degraded = false;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI.requestTimeoutMs);
      try {
        answer = await provider.generate({ ...input, signal: controller.signal });
      } catch (error) {
        if (provider === mockProvider) throw error;
        // A failing external provider must never break the assistant.
        console.warn("AI provider failed; using the built-in answer engine.", error instanceof Error ? error.message : error);
        answer = await mockProvider.generate(input);
        usedProvider = mockProvider.name;
        degraded = true;
      } finally {
        clearTimeout(timer);
      }

      return {
        answer,
        sources: sourcesFor(matched),
        actions: actionsFor(intents, matched),
        answered: true,
        provider: usedProvider,
        degraded,
      };
    },
  };
}

export type AssistantService = ReturnType<typeof createAssistantService>;
