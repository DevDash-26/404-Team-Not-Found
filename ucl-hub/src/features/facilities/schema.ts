import { z } from "zod";
import { FIELD_LIMITS } from "@/config/app";
import { text } from "@/lib/schemas";
import { FACILITY_CATEGORIES, FACILITY_PRIORITIES } from "@/types";

export const facilityIssueSchema = z.object({
  category: z.enum(FACILITY_CATEGORIES, { error: "Choose a category." }),
  location: text("Location", 3, FIELD_LIMITS.shortText),
  description: text("Description", 10, FIELD_LIMITS.message),
  priority: z.enum(FACILITY_PRIORITIES, { error: "Choose a priority." }),
  imageUrl: z.string().nullable(),
  imagePath: z.string().nullable(),
});

export type FacilityIssueInput = z.infer<typeof facilityIssueSchema>;
