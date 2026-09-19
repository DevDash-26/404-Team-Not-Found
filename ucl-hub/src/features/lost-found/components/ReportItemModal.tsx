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
import { CONTACT_METHODS, LOST_FOUND_CATEGORIES, type LostFoundType } from "@/types";
import { toDateKey } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { lostFoundSchema } from "../schema";

const CONTACT_LABELS = { email: "Email", phone: "Phone", "front-desk": "Hand over via the front desk" } as const;

interface ReportItemModalProps {
  open: boolean;
  defaultType: LostFoundType;
  onClose: () => void;
  onCreated: () => void;
}

export function ReportItemModal({ open, defaultType, onClose, onCreated }: ReportItemModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Report a lost or found item" description="The more detail you add, the easier it is to match." size="md">
      {open && <ReportForm defaultType={defaultType} onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function ReportForm({ defaultType, onClose, onCreated }: Omit<ReportItemModalProps, "open">) {
  const { lostFound } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();

  const form = useForm({
    initial: {
      type: defaultType as LostFoundType,
      title: "",
      description: "",
      category: "",
      location: "",
      date: toDateKey(new Date()),
      imageUrl: null as string | null,
      imagePath: null as string | null,
      contactType: "email" as (typeof CONTACT_METHODS)[number],
      contactValue: profile.email,
    },
    schema: lostFoundSchema,
    prepare: (v) => ({
      type: v.type,
      title: v.title,
      description: v.description,
      category: v.category,
      location: v.location,
      date: v.date,
      imageUrl: v.imageUrl,
      imagePath: v.imagePath,
      contact: { type: v.contactType, value: v.contactType === "front-desk" ? "" : v.contactValue },
    }),
    onSubmit: async (data) => {
      await lostFound.create(data, { id: user.uid, name: profile.name });
      toast.success(data.type === "lost" ? "Report posted. We'll show it to people who find things." : "Thanks for reporting it. The owner can now find it here.");
      onCreated();
      onClose();
    },
  });

  return (
    <form onSubmit={form.submit} noValidate className="space-y-4">
      <InlineError message={form.formError} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-slate-800">What are you reporting?</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(["lost", "found"] as const).map((type) => (
            <label
              key={type}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-medium ${form.values.type === type ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <input type="radio" name="type" value={type} checked={form.values.type === type} onChange={() => form.setValue("type", type)} className="sr-only" />
              {type === "lost" ? "I lost something" : "I found something"}
            </label>
          ))}
        </div>
      </fieldset>

      <TextInput label="Item" placeholder="e.g. Black Casio calculator" maxLength={100} required {...form.bind("title")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput label="Category" required placeholder="Choose category" options={LOST_FOUND_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))} {...form.bind("category")} />
        <TextInput label={form.values.type === "lost" ? "Date lost" : "Date found"} type="date" max={toDateKey(new Date())} required {...form.bind("date")} />
      </div>
      <TextInput label={form.values.type === "lost" ? "Where did you lose it?" : "Where did you find it?"} placeholder="e.g. Library, 2nd floor" required {...form.bind("location")} />
      <TextArea label="Description" rows={3} maxLength={2000} required placeholder="Colour, brand, marks, what's inside… (don't share full ID numbers)" {...form.bind("description")} />
      <ImageUpload
        label="Photo"
        folder={`uploads/${user.uid}/lost-found`}
        value={form.values.imageUrl && form.values.imagePath ? { url: form.values.imageUrl, path: form.values.imagePath } : null}
        onChange={(image) => {
          form.setValue("imageUrl", image?.url ?? null);
          form.setValue("imagePath", image?.path ?? null);
        }}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectInput
          label="How should people reach you?"
          required
          options={CONTACT_METHODS.map((m) => ({ value: m, label: CONTACT_LABELS[m] }))}
          value={form.values.contactType}
          onChange={(e) => form.setValue("contactType", e.target.value as (typeof CONTACT_METHODS)[number])}
        />
        {form.values.contactType !== "front-desk" && (
          <TextInput
            label={form.values.contactType === "email" ? "Email" : "Phone number"}
            type={form.values.contactType === "email" ? "email" : "tel"}
            required
            value={form.values.contactValue}
            error={form.errors["contact.value"]}
            onChange={(e) => form.setValue("contactValue", e.target.value)}
          />
        )}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.submitting}>
          Post report
        </Button>
      </div>
    </form>
  );
}
