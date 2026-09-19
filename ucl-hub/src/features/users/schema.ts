import { z } from "zod";
import { FACULTIES, YEARS, facultyById } from "@/config/academics";
import { allowedEmailDomains } from "@/config/env";
import { emailField, optionalText, text } from "@/lib/schemas";
import { ROLES, STAFF_ROLES } from "@/types";

const PASSWORD_MIN = 8;

const studentFields = {
  name: text("Full name", 2, 100),
  studentId: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9/-]{4,20}$/, "Use letters, numbers, / or - (for example UCL/23/0142)."),
  faculty: z.enum(FACULTIES.map((f) => f.id) as [string, ...string[]], { error: "Choose your faculty." }),
  programme: z.string().min(1, "Choose your programme."),
  year: z.number().int().refine((y) => (YEARS as readonly number[]).includes(y), "Choose your year of study."),
};

/** The programme must belong to the chosen faculty. */
function programmeMatchesFaculty(value: { faculty: string; programme: string }, ctx: z.RefinementCtx) {
  if (!facultyById(value.faculty)?.programmes.includes(value.programme)) {
    ctx.addIssue({ code: "custom", path: ["programme"], message: "That programme isn't offered by this faculty." });
  }
}

export const profileSchema = z.object(studentFields).superRefine(programmeMatchesFaculty);
export type ProfileInput = z.infer<typeof profileSchema>;

export const registrationSchema = z
  .object({
    ...studentFields,
    email: emailField.refine(
      (email) => allowedEmailDomains.length === 0 || allowedEmailDomains.some((d) => email.endsWith(`@${d}`)),
      `Please use your university email (${allowedEmailDomains.map((d) => `@${d}`).join(", ")}).`,
    ),
    password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`).max(128),
    confirmPassword: z.string(),
  })
  .superRefine((value, ctx) => {
    programmeMatchesFaculty(value, ctx);
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords don't match." });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

function staffRules(value: { role: string; staffRole: string | null; societyId: string | null }, ctx: z.RefinementCtx) {
  if (value.role === "staff" && !value.staffRole) {
    ctx.addIssue({ code: "custom", path: ["staffRole"], message: "Choose the staff group." });
  }
  if (value.role === "staff" && value.staffRole === "society" && !value.societyId) {
    ctx.addIssue({ code: "custom", path: ["societyId"], message: "Choose the society this representative manages." });
  }
}

/** Administrator creating a staff/admin/student account (form input). */
export const newUserSchema = z
  .object({
    name: text("Full name", 2, 100),
    email: emailField,
    password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`).max(128),
    role: z.enum(ROLES),
    staffRole: z.enum(STAFF_ROLES).nullable(),
    societyId: z.string().nullable(),
    department: optionalText("Department", 100),
  })
  .superRefine(staffRules);

export type NewUserInput = z.infer<typeof newUserSchema>;

/** Wire format accepted by `POST /api/admin/users` (the server re-validates everything). */
export const createUserRequestSchema = z
  .object({
    name: text("Full name", 2, 100),
    email: emailField,
    password: z.string().min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`).max(128),
    role: z.enum(ROLES),
    staffRole: z.enum(STAFF_ROLES).nullable(),
    societyId: z.string().max(100).nullable(),
    department: z.string().trim().max(100).nullable(),
  })
  .superRefine(staffRules);

/** Wire format accepted by `PATCH /api/admin/users/[uid]`. */
export const accessUpdateSchema = z
  .object({
    role: z.enum(ROLES),
    staffRole: z.enum(STAFF_ROLES).nullable(),
    societyId: z.string().max(100).nullable(),
  })
  .superRefine(staffRules);
