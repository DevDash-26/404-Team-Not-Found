/**
 * Browser-side entry point to the assistant.
 *
 * - Firebase mode: calls the server route (`/api/assistant`) so the AI provider
 *   key and the Admin SDK stay on the server.
 * - Memory (demo) mode: there is no server-side database, so the same
 *   `assistantService` runs in the browser over the local demo data with the
 *   built-in answer engine. No key is involved.
 */

import { AI } from "@/config/app";
import { callApi } from "@/lib/backend/apiClient";
import type { Backend } from "@/lib/backend/types";
import type { AssistantProfile, AssistantResponse, ChatTurn } from "./types";
import { createAssistantService } from "./assistantService";
import { createCachedKnowledgeLoader } from "./knowledge/collect";
import { logQuestion } from "./logging";
import { mockProvider } from "./providers/mock";

export interface AskInput {
  message: string;
  history: ChatTurn[];
  profile: AssistantProfile;
}

export interface AssistantClient {
  ask(input: AskInput): Promise<AssistantResponse>;
}

/** Local demo data changes when an admin edits content, so its cache is short. */
const LOCAL_CACHE_TTL_MS = 5_000;

export function createAssistantClient(backend: Backend): AssistantClient {
  if (backend.mode === "firebase") {
    return {
      ask: ({ message, history }) =>
        // Only the message and history travel to the server; identity and role come from the verified token there.
        callApi<AssistantResponse>(backend.auth, "POST", "/api/assistant", { message, history: history.slice(-AI.historyTurns * 2) }),
    };
  }

  const service = createAssistantService({ knowledge: createCachedKnowledgeLoader(backend.store, LOCAL_CACHE_TTL_MS), provider: mockProvider });
  return {
    async ask(input) {
      const response = await service.answer(input);
      void logQuestion(backend.store, input.message, response);
      return response;
    },
  };
}
