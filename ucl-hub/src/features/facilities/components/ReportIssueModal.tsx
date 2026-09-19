"use client";

import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextArea, TextInput } from "@/components/ui/Field";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Modal } from "@/components/ui/Modal";
import { InlineError } from "@/components/ui/States";
import { useForm } from "@/hooks/useForm";
import { FACILITY_CATEGORIES, FACILITY_PRIORITIES } from "@/types";
import { humanize } from "@/utils/text";
import { teamForCategory } from "../logic";
import { facilityIssueSchema } from "../schema";

interface ReportIssueModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ReportIssueModal({ open, onClose, onCreated }: ReportIssueModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Report a facility issue" description="Tell us what's wrong and where. You'll be notified as it progresses." size="md">
      {open && <IssueForm onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function IssueForm({ onClose, onCreated }: Omit<ReportIssueModalProps, "open">) {
  const { facilities } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();

  const form = useForm({
    initial: { category: "", location: "", description: "", priority: "medium", imageUrl: null as string | null, imagePath: null as string | null },
    schema: facilityIssueSchema,
    onSubmit: async (data) => {
      await facilities.create(data, { id: user.uid, name: profile.name });
      toast.success(teamForCategory(data.category) === "it" ? "Sent to IT Services. We'll keep you posted." : "Sent to Facilities Management. We'll keep you posted.");
      onCreated();
      onClose();
    },
  });

  return (
    <form onSubmit={form.submit} noValidate className="space-y-4">
      <InlineError message={form.formError} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput label="What kind of problem?" required placeholder="Choose category" options={FACILITY_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))} {...form.bind("category")} />
        <SelectInput label="How urgent is it?" required options={FACILITY_PRIORITIES.map((p) => ({ value: p, label: humanize(p) }))} {...form.bind("priority")} />
      </div>
      <TextInput label="Where is it?" placeholder="e.g. Block B, Room 204" required {...form.bind("location")} />
      <TextArea label="What's wrong?" rows={3} maxLength={2000} required placeholder="Describe the problem so the right team can fix it quickly." {...form.bind("description")} />
      <ImageUpload
        label="Photo"
        folder={`uploads/${user.uid}/facilities`}
        value={form.values.imageUrl && form.values.imagePath ? { url: form.values.imageUrl, path: form.values.imagePath } : null}
        onChange={(image) => {
          form.setValue("imageUrl", image?.url ?? null);
          form.setValue("imagePath", image?.path ?? null);
        }}
      />
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.submitting}>
          Submit report
        </Button>
      </div>
    </form>
  );
}
