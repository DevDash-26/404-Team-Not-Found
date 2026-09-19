import { createAnthropicProvider } from "./anthropic";
import { createGeminiProvider } from "./gemini";
import { mockProvider } from "./mock";
import { createOpenAiCompatibleProvider } from "./openaiCompatible";
import type { AiProvider } from "./types";

export type { AiProvider, GenerateInput } from "./types";
export { mockProvider };

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

type Env = Record<string, string | undefined>;

/**
 * Chooses the provider from server environment variables:
 *   AI_PROVIDER = mock | anthropic | gemini | openai   (default: mock)
 *   AI_API_KEY, AI_MODEL                                (required for non-mock)
 *   AI_BASE_URL                                         (openai-compatible only)
 * A misconfigured real provider falls back to the built-in engine rather than
 * breaking the assistant.
 */
export function createProviderFromEnv(env: Env): AiProvider {
  const choice = (env.AI_PROVIDER ?? "mock").toLowerCase();
  const apiKey = env.AI_API_KEY;
  const model = env.AI_MODEL;

  if (choice === "mock") return mockProvider;
  if (!apiKey || !model) {
    console.warn(`AI_PROVIDER=${choice} needs AI_API_KEY and AI_MODEL. Falling back to the built-in answer engine.`);
    return mockProvider;
  }
  switch (choice) {
    case "anthropic":
      return createAnthropicProvider(apiKey, model);
    case "gemini":
      return createGeminiProvider(apiKey, model);
    case "openai":
      return createOpenAiCompatibleProvider(apiKey, model, env.AI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL);
    default:
      console.warn(`Unknown AI_PROVIDER "${choice}". Falling back to the built-in answer engine.`);
      return mockProvider;
  }
}
