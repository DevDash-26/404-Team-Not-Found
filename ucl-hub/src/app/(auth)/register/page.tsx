"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextInput } from "@/components/ui/Field";
import { InlineError } from "@/components/ui/States";
import { FACULTIES, YEARS, facultyById } from "@/config/academics";
import { allowedEmailDomains } from "@/config/env";
import { registrationSchema } from "@/features/users/schema";
import { useForm } from "@/hooks/useForm";

export default function RegisterPage() {
  const { register } = useAuth();

  const form = useForm({
    initial: { name: "", studentId: "", email: "", faculty: "", programme: "", year: "", password: "", confirmPassword: "" },
    schema: registrationSchema,
    prepare: (values) => ({ ...values, year: Number(values.year) }),
    onSubmit: async (data) => {
      await register(data);
    },
  });

  const programmes = facultyById(form.values.faculty)?.programmes ?? [];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your student account</h1>
      <p className="mt-1 text-sm text-slate-600">
        {allowedEmailDomains.length > 0 ? `Use your university email (${allowedEmailDomains.map((d) => `@${d}`).join(", ")}).` : "Use your university email."} Staff accounts are created by an administrator.
      </p>

      <form onSubmit={form.submit} noValidate className="mt-6 space-y-4">
        <InlineError message={form.formError} />
        <TextInput label="Full name" autoComplete="name" required {...form.bind("name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Student ID" placeholder="UCL/23/0142" required {...form.bind("studentId")} />
          <TextInput label="Email" type="email" autoComplete="email" required {...form.bind("email")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectInput
            label="Faculty"
            required
            placeholder="Choose faculty"
            options={FACULTIES.map((f) => ({ value: f.id, label: f.name }))}
            value={form.values.faculty}
            error={form.errors.faculty}
            onChange={(event) => {
              form.setValue("faculty", event.target.value);
              form.setValue("programme", "");
            }}
          />
          <SelectInput
            label="Year of study"
            required
            placeholder="Choose year"
            options={YEARS.map((y) => ({ value: String(y), label: `Year ${y}` }))}
            {...form.bind("year")}
          />
        </div>
        <SelectInput
          label="Programme"
          required
          placeholder={form.values.faculty ? "Choose programme" : "Choose a faculty first"}
          disabled={!form.values.faculty}
          options={programmes.map((p) => ({ value: p, label: p }))}
          {...form.bind("programme")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." required {...form.bind("password")} />
          <TextInput label="Confirm password" type="password" autoComplete="new-password" required {...form.bind("confirmPassword")} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={form.submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
