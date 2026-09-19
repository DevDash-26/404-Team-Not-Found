/**
 * Thin wrapper around zod so forms and services share one validation shape:
 * a map of field path -> first error message.
 */

import type { ZodType } from "zod";

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

export function validate<T>(schema: ZodType<T>, values: unknown): ValidationResult<T> {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    // Keep the first message per field: it is the most fundamental problem.
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
