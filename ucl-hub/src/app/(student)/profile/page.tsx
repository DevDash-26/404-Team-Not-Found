"use client";

import { useState } from "react";
import { useAuth, useCurrentUser } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SelectInput, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { InlineError } from "@/components/ui/States";
import { Avatar } from "@/components/ui/Avatar";
import { FACULTIES, YEARS, facultyById } from "@/config/academics";
import { profileSchema } from "@/features/users/schema";
import { useForm } from "@/hooks/useForm";
import { STAFF_ROLE_LABELS } from "@/types";
import { formatDate } from "@/utils/dates";

export default function ProfilePage() {
  const { updateProfile, sendPasswordReset } = useAuth();
  const { profile, access } = useCurrentUser();
  const toast = useToast();
  const [resetSent, setResetSent] = useState(false);
  const isStudent = access.role === "student";

  const form = useForm({
    initial: {
      name: profile.name,
      studentId: profile.studentId ?? "",
      faculty: profile.faculty ?? "",
      programme: profile.programme ?? "",
      year: profile.year ? String(profile.year) : "",
    },
    schema: profileSchema,
    prepare: (values) => ({ ...values, year: Number(values.year) }),
    onSubmit: async (data) => {
      await updateProfile(data);
      toast.success("Profile updated. Announcements and the calendar now follow your new details.");
    },
  });

  const programmes = facultyById(form.values.faculty)?.programmes ?? [];
  const roleText = access.role === "admin" ? "Administrator" : access.role === "staff" && access.staffRole ? STAFF_ROLE_LABELS[access.staffRole] : "Student";

  return (
    <>
      <PageHeader title="Your profile" description="Your details decide which announcements and calendar dates you see." />

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={profile.name} className="size-16 text-xl" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-600">{profile.email}</p>
            <Badge tone="brand" className="mt-2">
              {roleText}
            </Badge>
            <p className="mt-3 text-xs text-slate-500">Member since {formatDate(profile.createdAt)}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              disabled={resetSent}
              onClick={async () => {
                try {
                  await sendPasswordReset(profile.email);
                  setResetSent(true);
                  toast.success("Password reset link sent to your email.");
                } catch {
                  toast.error("Couldn't send the reset link. Try again later.");
                }
              }}
            >
              {resetSent ? "Reset link sent" : "Send password reset link"}
            </Button>
          </CardBody>
        </Card>

        {isStudent ? (
          <Card>
            <CardHeader title="Academic details" description="Keep these up to date when you change year or programme." />
            <CardBody>
              <form onSubmit={form.submit} noValidate className="space-y-4">
                <InlineError message={form.formError} />
                <TextInput label="Full name" required {...form.bind("name")} />
                <TextInput label="Student ID" required {...form.bind("studentId")} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectInput
                    label="Faculty"
                    required
                    placeholder="Choose faculty"
                    options={FACULTIES.map((f) => ({ value: f.id, label: f.name }))}
                    value={form.values.faculty}
                    error={form.errors.faculty}
                    onChange={(e) => {
                      form.setValue("faculty", e.target.value);
                      form.setValue("programme", "");
                    }}
                  />
                  <SelectInput label="Year" required placeholder="Choose year" options={YEARS.map((y) => ({ value: String(y), label: `Year ${y}` }))} {...form.bind("year")} />
                </div>
                <SelectInput label="Programme" required placeholder="Choose programme" disabled={!form.values.faculty} options={programmes.map((p) => ({ value: p, label: p }))} {...form.bind("programme")} />
                <div className="flex justify-end">
                  <Button type="submit" loading={form.submitting}>
                    Save changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Staff account" description="Staff roles are managed by an administrator." />
            <CardBody className="space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-medium">Role:</span> {roleText}
              </p>
              {profile.department && (
                <p>
                  <span className="font-medium">Department:</span> {profile.department}
                </p>
              )}
              <p className="text-slate-500">Contact an administrator to change your access.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
