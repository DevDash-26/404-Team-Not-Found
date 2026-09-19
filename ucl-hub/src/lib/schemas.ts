/** Reusable zod building blocks for form and service validation. */

import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { isValidDateKey } from "@/utils/dates";
import { sanitizeText } from "@/utils/text";

export function text(label: string, min = 1, max: number = FIELD_LIMITS.shortText) {
  return z
    .string({ error: `${label} is required.` })
    .transform(sanitizeText)
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
        .max(max, `${label} must be ${max} characters or fewer.`),
    );
}

export function optionalText(label: string, max: number = FIELD_LIMITS.shortText) {
  return z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer.`))
    .default("");
}

/** A URL that must be http(s), or an empty string. */
export const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Enter a full link starting with http:// or https://")
  .default("");

export const requiredUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\/[^\s]+$/i, "Enter a full link starting with http:// or https://");

export const emailField = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));

export const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.")
  .default("");

export const phoneField = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[+()\d\s-]{7,20}$/.test(v), "Enter a valid phone number.")
  .default("");

export const dateKeyField = z.string().refine(isValidDateKey, "Choose a valid date.");

export const isoField = z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Choose a valid date and time.");

export const audienceSchema = z.object({
  faculties: z.array(z.string()).default([]),
  programmes: z.array(z.string()).default([]),
  years: z.array(z.number().int().min(1).max(6)).default([]),
});

export const attachmentSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().min(1),
  path: z.string().min(1),
});

export const positiveInt = (label: string, min = 0, max = 100_000) =>
  z.number({ error: `${label} must be a number.` }).int(`${label} must be a whole number.`).min(min, `${label} must be at least ${min}.`).max(max, `${label} must be ${max} or fewer.`);
