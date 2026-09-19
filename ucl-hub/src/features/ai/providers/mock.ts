import { composeExtractiveAnswer } from "./extractive";
import type { AiProvider, GenerateInput } from "./types";

/** Deterministic, offline provider: answers straight from the retrieved documents. */
export const mockProvider: AiProvider = {
  name: "mock",
  async generate({ documents, intents, window, now, question }: GenerateInput): Promise<string> {
    return composeExtractiveAnswer({ documents, intents, window, now, question });
  },
};
