import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { optionalEmail, optionalText, phoneField, requiredUrl, text } from "@/lib/schemas";
import { SERVICE_CATEGORIES } from "@/types";

export const serviceSchema = z.object({
  name: text("Name", 2, FIELD_LIMITS.name),
  category: z.enum(SERVICE_CATEGORIES, { error: "Choose a category." }),
  description: text("Description", 10, FIELD_LIMITS.description),
  location: text("Location", 2, FIELD_LIMITS.shortText),
  openingHours: z
    .array(z.object({ days: text("Days", 2, 80), hours: text("Hours", 2, 80) }))
    .min(1, "Add at least one line of opening hours.")
    .max(10),
  email: optionalEmail,
  phone: phoneField,
  links: z.array(z.object({ label: text("Label", 2, 60), url: requiredUrl })).max(8),
});

export type ServiceInput = z.infer<typeof serviceSchema>;

export const staffContactSchema = z.object({
  name: text("Name", 2, FIELD_LIMITS.name),
  title: text("Job title", 2, FIELD_LIMITS.name),
  department: text("Department", 2, FIELD_LIMITS.name),
  email: optionalEmail,
  phone: phoneField,
  office: optionalText("Office", FIELD_LIMITS.shortText),
  topics: z.array(z.string().trim().min(1).max(40)).max(20),
});

export type StaffContactInput = z.infer<typeof staffContactSchema>;
