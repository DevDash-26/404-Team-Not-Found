import { AppError } from "@/utils/errors";
import { postJson } from "./http";
import type { AiProvider, GenerateInput } from "./types";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export function createGeminiProvider(apiKey: string, model: string): AiProvider {
  return {
    name: "gemini",
    async generate({ system, messages, maxTokens, signal }: GenerateInput): Promise<string> {
      const data = await postJson<GeminiResponse>(
        `${BASE_URL}/${encodeURIComponent(model)}:generateContent`,
        { "x-goog-api-key": apiKey },
        {
          systemInstruction: { parts: [{ text: system }] },
          contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          generationConfig: { maxOutputTokens: maxTokens },
        },
        signal,
      );
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
      if (!text) throw new AppError("unavailable", "The AI provider returned an empty answer.");
      return text;
    },
  };
}
