/**
 * Error model shared by the data layer, services and UI.
 *
 * Lower layers throw `AppError` with a machine-readable `code`; the UI turns any
 * thrown value into a friendly message with `toUserMessage` so users never see
 * raw SDK errors.
 */

export type AppErrorCode =
  | "validation"
  | "not-found"
  | "already-exists"
  | "permission-denied"
  | "unauthenticated"
  | "conflict"
  | "unavailable"
  | "rate-limited"
  | "unknown";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AppError";
    this.code = code;
  }
}

/** Raised when a booking overlaps an existing one. Carries the clashing slots. */
export class BookingConflictError extends AppError {
  readonly slots: string[];

  constructor(slots: string[]) {
    super("conflict", "That time is no longer available. Please pick another slot.");
    this.name = "BookingConflictError";
    this.slots = slots;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

const FRIENDLY: Record<AppErrorCode, string> = {
  validation: "Please check the highlighted fields and try again.",
  "not-found": "We couldn't find that item. It may have been removed.",
  "already-exists": "That has already been submitted.",
  "permission-denied": "You don't have permission to do that.",
  unauthenticated: "Please sign in to continue.",
  conflict: "That clashes with something that already exists.",
  unavailable: "We couldn't reach the server. Check your connection and try again.",
  "rate-limited": "You're going a little fast. Please wait a moment and try again.",
  unknown: "Something went wrong. Please try again.",
};

export function toUserMessage(error: unknown): string {
  if (isAppError(error)) {
    // Validation/conflict errors carry messages written for end users.
    return error.code === "validation" || error.code === "conflict" || error.code === "rate-limited"
      ? error.message || FRIENDLY[error.code]
      : FRIENDLY[error.code] ?? error.message;
  }
  if (error instanceof Error && typeof navigator !== "undefined" && navigator.onLine === false) {
    return FRIENDLY.unavailable;
  }
  return FRIENDLY.unknown;
}

/** Maps a Firebase-style error code (e.g. "permission-denied") to an AppError. */
export function fromFirebaseCode(code: string | undefined, cause?: unknown): AppError {
  const short = (code ?? "").replace(/^(firestore|storage|auth)\//, "");
  switch (short) {
    case "permission-denied":
    case "unauthorized":
      return new AppError("permission-denied", FRIENDLY["permission-denied"], { cause });
    case "unauthenticated":
      return new AppError("unauthenticated", FRIENDLY.unauthenticated, { cause });
    case "not-found":
      return new AppError("not-found", FRIENDLY["not-found"], { cause });
    case "already-exists":
      return new AppError("already-exists", FRIENDLY["already-exists"], { cause });
    case "unavailable":
    case "deadline-exceeded":
    case "network-request-failed":
      return new AppError("unavailable", FRIENDLY.unavailable, { cause });
    case "resource-exhausted":
      return new AppError("rate-limited", FRIENDLY["rate-limited"], { cause });
    default:
      return new AppError("unknown", FRIENDLY.unknown, { cause });
  }
}
