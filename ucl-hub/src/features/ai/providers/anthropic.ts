import { AppError } from "@/utils/errors";
import { postJson } from "./http";
import type { AiProvider, GenerateInput } from "./types";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
}

export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  return {
    name: "anthropic",
    async generate({ system, messages, maxTokens, signal }: GenerateInput): Promise<string> {
      const data = await postJson<AnthropicResponse>(
        ENDPOINT,
        { "x-api-key": apiKey, "anthropic-version": API_VERSION },
        { model, max_tokens: maxTokens, system, messages },
        signal,
      );
      const text = (data.content ?? []).filter((block) => block.type === "text").map((block) => block.text ?? "").join("").trim();
      if (!text) throw new AppError("unavailable", "The AI provider returned an empty answer.");
      return text;
    },
  };
}
