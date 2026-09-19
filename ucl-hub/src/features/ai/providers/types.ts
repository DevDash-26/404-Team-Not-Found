import type { ChatTurn, Intent, KnowledgeDocument, TimeWindow } from "../types";

export interface GenerateInput {
  /** System instructions (used by real language-model providers). */
  system: string;
  /** Conversation including the question with its context attached. */
  messages: ChatTurn[];
  /** The retrieved documents themselves, used by the built-in answer engine. */
  documents: KnowledgeDocument[];
  question: string;
  intents: Intent[];
  window: TimeWindow | null;
  now: Date;
  maxTokens: number;
  signal?: AbortSignal;
}

/** Anything that can turn a question plus retrieved context into an answer. */
export interface AiProvider {
  readonly name: string;
  generate(input: GenerateInput): Promise<string>;
}
