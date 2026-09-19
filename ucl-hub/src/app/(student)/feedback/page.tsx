"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { SelectInput, TextArea } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { InlineError } from "@/components/ui/States";
import { feedbackSchema } from "@/features/feedback/schema";
import { useForm } from "@/hooks/useForm";
import { FEEDBACK_CATEGORIES } from "@/types";
import { humanize } from "@/utils/text";

const LABELS: Record<(typeof FEEDBACK_CATEGORIES)[number], string> = {
  suggestion: "Suggestion or idea",
  "content-issue": "Something is wrong or out of date",
  bug: "The app isn't working properly",
  question: "I have a question",
  other: "Something else",
};

export default function FeedbackPage() {
  const { feedback } = useServices();
  const { user, profile } = useCurrentUser();
  const [sent, setSent] = useState(false);

  const form = useForm({
    initial: { category: "suggestion", message: "" },
    schema: feedbackSchema,
    onSubmit: async (data) => {
      await feedback.submit(data, { id: user.uid, name: profile.name });
      setSent(true);
    },
  });

  return (
    <>
      <PageHeader title="Feedback" description="Tell us what's working, what isn't, or what's missing. Every message is read by the platform team." />
      <Card className="max-w-2xl">
        <CardBody>
          {sent ? (
            <div role="status" className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="mb-3 size-10 text-emerald-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-900">Thank you!</h2>
              <p className="mt-1 text-sm text-slate-600">Your feedback has been sent to the team.</p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => {
                  form.reset();
                  setSent(false);
                }}
              >
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={form.submit} noValidate className="space-y-4">
              <InlineError message={form.formError} />
              <SelectInput label="What is it about?" required options={FEEDBACK_CATEGORIES.map((c) => ({ value: c, label: LABELS[c] ?? humanize(c) }))} {...form.bind("category")} />
              <TextArea label="Your message" rows={5} maxLength={2000} required hint="Please don't include passwords or sensitive personal details." {...form.bind("message")} />
              <div className="flex justify-end">
                <Button type="submit" loading={form.submitting}>
                  Send feedback
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </>
  );
}
