import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { dateKeyField, requiredUrl, text } from "@/lib/schemas";
import { JOB_TYPES } from "@/types";

export const jobSchema = z.object({
  company: text("Company", 2, FIELD_LIMITS.name),
  position: text("Position", 3, FIELD_LIMITS.title),
  description: text("Description", 10, FIELD_LIMITS.description),
  location: text("Location", 2, FIELD_LIMITS.shortText),
  type: z.enum(JOB_TYPES, { error: "Choose a type." }),
  deadline: dateKeyField,
  applyUrl: requiredUrl,
  skills: z.array(z.string().trim().min(1).max(40)).max(12, "List up to 12 skills."),
});

export type JobInput = z.infer<typeof jobSchema>;
