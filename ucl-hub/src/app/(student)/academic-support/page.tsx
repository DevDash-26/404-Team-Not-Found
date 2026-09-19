"use client";

import { BookOpenCheck, GraduationCap, Handshake, Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { SupportStatusBadge } from "@/components/common/StatusBadges";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, InlineError, LoadingRows } from "@/components/ui/States";
import { supportRequestSchema } from "@/features/support/schema";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useForm } from "@/hooks/useForm";
import { SUPPORT_TYPES, type SupportType } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

const TYPE_INFO: Record<SupportType, { title: string; blurb: string; icon: typeof GraduationCap }> = {
  "peer-tutoring": { title: "Peer tutoring", blurb: "Get one-to-one help with a subject from a senior student.", icon: BookOpenCheck },
  "study-group": { title: "Study group", blurb: "Be matched with classmates studying the same module.", icon: UsersRound },
  mentorship: { title: "Mentorship", blurb: "Learn from a mentor about studies, careers and student life.", icon: Handshake },
};

export default function AcademicSupportPage() {
  const { support } = useServices();
  const { user } = useCurrentUser();
  const [requesting, setRequesting] = useState<SupportType | null>(null);
  const { data, loading, error, reload } = useAsyncData(() => support.listMine(user.uid), [support, user.uid]);

  return (
    <>
      <PageHeader title="Academic support" description="Ask for a tutor, a study group or a mentor. Academic staff will match you and let you know." />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {SUPPORT_TYPES.map((type) => {
          const info = TYPE_INFO[type];
          return (
            <Card key={type} className="flex flex-col p-5">
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <info.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-semibold text-slate-900">{info.title}</h2>
              <p className="mt-1 flex-1 text-sm text-slate-600">{info.blurb}</p>
              <Button className="mt-4" variant="secondary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setRequesting(type)}>
                Request {info.title.toLowerCase()}
              </Button>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">Your requests</h2>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingRows count={3} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={<GraduationCap className="size-6" aria-hidden="true" />} title="No requests yet" description="Choose a type of support above to get started." />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{request.subject}</h3>
                <Badge tone="brand">{humanize(request.type)}</Badge>
                <SupportStatusBadge status={request.status} />
                <span className="ml-auto text-xs text-slate-500">Requested {formatDate(request.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{request.description}</p>
              {request.preferredTimes && <p className="mt-1 text-sm text-slate-500">Preferred times: {request.preferredTimes}</p>}
              {request.matchedWith && (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  Matched with <strong>{request.matchedWith.name}</strong>
                  {request.matchedWith.email && (
                    <>
                      {" "}
                      (<a className="underline" href={`mailto:${request.matchedWith.email}`}>{request.matchedWith.email}</a>)
                    </>
                  )}
                  . {request.staffNote}
                </p>
              )}
              {!request.matchedWith && request.staffNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{request.staffNote}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={requesting !== null} onClose={() => setRequesting(null)} title={requesting ? `Request ${TYPE_INFO[requesting].title.toLowerCase()}` : "Request support"} size="md">
        {requesting && (
          <SupportForm
            type={requesting}
            onDone={() => {
              setRequesting(null);
              reload();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function SupportForm({ type, onDone }: { type: SupportType; onDone: () => void }) {
  const { support } = useServices();
  const { profile } = useCurrentUser();
  const toast = useToast();
  const form = useForm({
    initial: { type, subject: "", description: "", preferredTimes: "" },
    schema: supportRequestSchema,
    onSubmit: async (data) => {
      await support.create(data, profile);
      toast.success("Request sent. Academic staff will be in touch.");
      onDone();
    },
  });
  return (
    <form onSubmit={form.submit} noValidate className="space-y-4">
      <InlineError message={form.formError} />
      <SelectInput label="Type of support" required options={SUPPORT_TYPES.map((t) => ({ value: t, label: TYPE_INFO[t].title }))} value={form.values.type} error={form.errors.type} onChange={(e) => form.setValue("type", e.target.value as SupportType)} />
      <TextInput label="Subject or module" placeholder="e.g. SE2010 Data Structures" required {...form.bind("subject")} />
      <TextArea label="What do you need help with?" rows={3} maxLength={2000} required {...form.bind("description")} />
      <TextInput label="Preferred times (optional)" placeholder="e.g. Weekday evenings after 4 pm" {...form.bind("preferredTimes")} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.submitting}>
          Send request
        </Button>
      </div>
    </form>
  );
}
