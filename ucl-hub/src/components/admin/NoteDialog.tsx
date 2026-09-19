"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { toUserMessage } from "@/utils/errors";

interface NoteDialogProps {
  open: boolean;
  title: string;
  description?: string;
  noteLabel: string;
  noteHint?: string;
  /** When true the staff member must type a note before confirming. */
  required?: boolean;
  confirmLabel: string;
  tone?: "primary" | "danger";
  onConfirm: (note: string) => Promise<void>;
  onClose: () => void;
}

function NoteForm({ noteLabel, noteHint, required, confirmLabel, tone, onConfirm, onClose }: Omit<NoteDialogProps, "open" | "title" | "description">) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (required && note.trim().length < 3) {
      setError("Please add a short note.");
      return;
    }
    setBusy(true);
    try {
      await onConfirm(note.trim());
      onClose();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextArea
        label={noteLabel}
        hint={noteHint}
        required={required}
        rows={3}
        maxLength={500}
        value={note}
        error={error}
        onChange={(e) => {
          setNote(e.target.value);
          setError(undefined);
        }}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant={tone === "danger" ? "danger" : "primary"} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}

/** A small dialog that asks for an optional or required note before a staff decision is saved. */
export function NoteDialog({ open, title, description, onClose, ...form }: NoteDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      {open && <NoteForm {...form} onClose={onClose} />}
    </Modal>
  );
}
