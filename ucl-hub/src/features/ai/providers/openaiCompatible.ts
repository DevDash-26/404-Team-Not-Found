import { AppError } from "@/utils/errors";
import { postJson } from "./http";
import type { AiProvider, GenerateInput } from "./types";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/** Works with OpenAI and any service exposing the same chat-completions API (set AI_BASE_URL). */
export function createOpenAiCompatibleProvider(apiKey: string, model: string, baseUrl: string): AiProvider {
  return {
    name: "openai",
    async generate({ system, messages, maxTokens, signal }: GenerateInput): Promise<string> {
      const data = await postJson<ChatCompletionResponse>(
        `${baseUrl.replace(/\/$/, "")}/chat/completions`,
        { Authorization: `Bearer ${apiKey}` },
        { model, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] },
        signal,
      );
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new AppError("unavailable", "The AI provider returned an empty answer.");
      return text;
    },
  };
}
