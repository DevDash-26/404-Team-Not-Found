import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { emailField, isoField, positiveInt, text } from "@/lib/schemas";
import { SOCIETY_CATEGORIES } from "@/types";

export const societySchema = z.object({
  name: text("Name", 3, FIELD_LIMITS.name),
  description: text("Description", 10, FIELD_LIMITS.description),
  category: z.enum(SOCIETY_CATEGORIES, { error: "Choose a category." }),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour such as #2c4e8c."),
  contactEmail: emailField,
  committee: z
    .array(z.object({ role: text("Role", 2, 60), name: text("Name", 2, FIELD_LIMITS.name), email: emailField }))
    .max(12, "Up to 12 committee members."),
  activities: z
    .array(z.object({ title: text("Title", 3, FIELD_LIMITS.title), date: isoField, location: text("Location", 2, FIELD_LIMITS.shortText) }))
    .max(20, "Up to 20 activities."),
  memberCount: positiveInt("Member count", 0, 100_000),
  logoUrl: z.string().nullable(),
  logoPath: z.string().nullable(),
});

export type SocietyInput = z.infer<typeof societySchema>;

export const societyInterestSchema = z.object({
  message: z.string().transform((v) => v.trim()).pipe(z.string().max(500, "Please keep your message under 500 characters.")),
});
