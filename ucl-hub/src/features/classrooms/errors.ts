import { AppError } from "@/utils/errors";
import type { BookingIssue } from "./logic";

/** Thrown when a booking request breaks a rule; carries per-field issues for the form. */
export class BookingValidationError extends AppError {
  readonly issues: BookingIssue[];

  constructor(issues: BookingIssue[]) {
    super("validation", issues[0]?.message ?? "Please check your booking details.");
    this.name = "BookingValidationError";
    this.issues = issues;
  }
}
