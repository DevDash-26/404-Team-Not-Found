import { AI } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import type { Clock } from "@/utils/clock";
import { systemClock } from "@/utils/clock";
import type { AssistantResponse } from "./types";

/**
 * Records an anonymous usage entry (no user id or name) so administrators can
 * see which questions go unanswered and improve the knowledge base.
 * Logging failures are swallowed: they must never break an answer.
 */
export async function logQuestion(store: DataStore, question: string, response: AssistantResponse, clock: Clock = systemClock): Promise<void> {
  try {
    await store.commit([
      {
        kind: "create",
        path: `${COLLECTIONS.assistantLogs}/${store.newId(COLLECTIONS.assistantLogs)}`,
        data: {
          question: question.replace(/\s+/g, " ").trim().slice(0, AI.maxQuestionChars),
          answered: response.answered,
          sourceCount: response.sources.length,
          provider: response.provider,
          createdAt: clock.now().toISOString(),
        },
      },
    ]);
  } catch (error) {
    console.warn("Could not record assistant log:", error instanceof Error ? error.message : error);
  }
}
