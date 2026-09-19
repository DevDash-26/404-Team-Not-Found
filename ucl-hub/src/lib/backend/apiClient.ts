/**
 * Calls this app's own API routes with the signed-in user's ID token.
 * Errors are converted to `AppError`s using the HTTP status, so callers handle
 * failures the same way as data-layer errors.
 */

import { AppError, type AppErrorCode } from "@/utils/errors";
import type { AuthPort } from "./types";

function codeForStatus(status: number): AppErrorCode {
  if (status === 400) return "validation";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "permission-denied";
  if (status === 404) return "not-found";
  if (status === 409) return "already-exists";
  if (status === 429) return "rate-limited";
  if (status === 503) return "unavailable";
  return "unknown";
}

export async function callApi<T>(auth: AuthPort, method: "POST" | "PATCH", url: string, body: unknown): Promise<T> {
  const token = await auth.getIdToken();
  if (!token) throw new AppError("unauthenticated", "Please sign in to continue.");

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AppError("unavailable", "We couldn't reach the server. Check your connection.", { cause: error });
  }

  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new AppError(codeForStatus(response.status), payload.error ?? "The request failed.");
  return payload as T;
}
