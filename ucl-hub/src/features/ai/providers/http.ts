import { AppError } from "@/utils/errors";

/** POSTs JSON and returns the parsed body, turning failures into AppErrors (no secrets in messages). */
export async function postJson<T>(url: string, headers: Record<string, string>, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new AppError("unavailable", "The AI provider could not be reached.", { cause: error });
  }
  if (!response.ok) {
    throw new AppError(response.status === 429 ? "rate-limited" : "unavailable", `The AI provider returned ${response.status}.`);
  }
  return (await response.json()) as T;
}
