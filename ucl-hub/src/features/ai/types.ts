/** Shared types for the AI assistant. */

export type KnowledgeKind =
  | "announcement"
  | "event"
  | "faq"
  | "service"
  | "staff"
  | "job"
  | "calendar"
  | "room"
  | "society"
  | "guide"
  | "note";

/**
 * One retrievable unit of campus knowledge. Every module of the app is
 * converted into these documents, so the assistant reads the same structured
 * data students see in the app instead of a separate copy.
 */
export interface KnowledgeDocument {
  id: string;
  kind: KnowledgeKind;
  title: string;
  /** Plain-text body used for matching and shown to the language model. */
  text: string;
  /** Extra words that should match this document (tags, synonyms). */
  keywords: string[];
  /** In-app route (or external URL) that opens the source. */
  href: string;
  /** ISO instants for time-based questions ("what's on this week?"). */
  startsAt?: string;
  endsAt?: string;
  /** Concise facts used to phrase answers without a language model. */
  facts?: {
    hours?: string;
    location?: string;
    contact?: string;
    deadline?: string;
    when?: string;
  };
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantAction {
  label: string;
  href: string;
}

export interface AssistantSource {
  title: string;
  href: string;
  kind: KnowledgeKind;
}

export interface AssistantResponse {
  answer: string;
  sources: AssistantSource[];
  actions: AssistantAction[];
  /** False when nothing relevant was found and a fallback message was returned. */
  answered: boolean;
  /** Which provider produced the wording ("mock", "anthropic", ...). */
  provider: string;
  /** True when a real AI provider failed and the built-in answer engine was used instead. */
  degraded: boolean;
}

export interface AssistantProfile {
  name: string;
  role: string;
  faculty: string | null;
  programme: string | null;
  year: number | null;
}

export interface TimeWindow {
  from: Date;
  to: Date;
  /** Human label such as "this week". */
  label: string;
}

export interface Intent {
  id: string;
  /** Kinds of documents that are more likely to answer this kind of question. */
  boost: Partial<Record<KnowledgeKind, number>>;
  actions: AssistantAction[];
}
