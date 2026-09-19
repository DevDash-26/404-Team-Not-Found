import { z } from "zod";
import type { AssistantProfile } from "@/features/ai/types";
import { AI } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import { logQuestion } from "@/features/ai/logging";
import { getAssistantRuntime } from "@/lib/server/assistant";
import { errorResponse, json, parseBody } from "@/lib/server/http";
import { verifyCaller } from "@/lib/server/verifyRequest";
import type { UserProfile } from "@/types";
import { AppError } from "@/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().max(AI.maxQuestionChars * 2),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(AI.historyTurns * 2)
    .default([]),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const caller = await verifyCaller(request);
    const { store, service, limiter } = getAssistantRuntime();
    if (!limiter.take(caller.uid)) throw new AppError("rate-limited", "You're asking very quickly. Please wait a moment and try again.");

    const { message, history } = await parseBody(request, bodySchema);

    // Role comes from the verified token; the profile document only supplies faculty/programme/year for targeting.
    const stored = await store.get<UserProfile>(`${COLLECTIONS.users}/${caller.uid}`);
    const profile: AssistantProfile = {
      name: stored?.name ?? caller.name,
      role: caller.claims.role === "student" ? "student" : (caller.claims.staffRole ?? caller.claims.role),
      faculty: stored?.faculty ?? null,
      programme: stored?.programme ?? null,
      year: stored?.year ?? null,
    };

    const response = await service.answer({ message, history, profile });
    void logQuestion(store, message, response);
    return json(response);
  } catch (error) {
    return errorResponse(error);
  }
}
