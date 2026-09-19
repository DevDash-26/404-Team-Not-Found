/** Small helpers for API route responses: consistent JSON and error mapping. */

import { NextResponse } from "next/server";
import type { z } from "zod";
import { AppError, type AppErrorCode } from "@/utils/errors";

const STATUS: Record<AppErrorCode, number> = {
  validation: 400,
  unauthenticated: 401,
  "permission-denied": 403,
  "not-found": 404,
  "already-exists": 409,
  conflict: 409,
  "rate-limited": 429,
  unavailable: 503,
  unknown: 500,
};

export function json<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Turns any thrown value into a safe JSON response (internal details are logged, never returned). */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    if (error.code === "unknown" || error.code === "unavailable") console.error(error);
    return json({ error: error.message }, STATUS[error.code]);
  }
  console.error(error);
  return json({ error: "Something went wrong. Please try again." }, 500);
}

/** Parses and validates a JSON request body with a zod schema. */
export async function parseBody<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError("validation", "The request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AppError("validation", result.error.issues[0]?.message ?? "The request is not valid.");
  }
  return result.data;
}
