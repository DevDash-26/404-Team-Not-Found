/**
 * Server-side assistant runtime. It reads campus knowledge with the Admin SDK,
 * picks the AI provider from server-only environment variables (the API key
 * never reaches the browser) and keeps a per-process knowledge cache.
 */

import "server-only";
import { createAssistantService, type AssistantService } from "@/features/ai/assistantService";
import { createCachedKnowledgeLoader } from "@/features/ai/knowledge/collect";
import { createProviderFromEnv } from "@/features/ai/providers";
import { AI } from "@/config/app";
import type { DataStore } from "@/lib/backend/types";
import { AdminFirestoreStore } from "./adminStore";
import { getAdminDb } from "./firebaseAdmin";
import { createRateLimiter, type RateLimiter } from "./rateLimit";

interface Runtime {
  store: DataStore;
  service: AssistantService;
  limiter: RateLimiter;
}

let runtime: Runtime | null = null;

export function getAssistantRuntime(): Runtime {
  if (runtime) return runtime;
  const store = new AdminFirestoreStore(getAdminDb());
  runtime = {
    store,
    service: createAssistantService({ knowledge: createCachedKnowledgeLoader(store), provider: createProviderFromEnv(process.env) }),
    limiter: createRateLimiter(AI.rateLimitPerMinute),
  };
  return runtime;
}
