"use client";

import { FileText, Paperclip, X } from "lucide-react";
import { useId, useState } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import { Spinner } from "@/components/ui/States";
import { UPLOAD } from "@/config/app";
import type { Attachment } from "@/types";
import { toUserMessage } from "@/utils/errors";
import { randomFileId } from "@/utils/image";

interface FilesFieldProps {
  label: string;
  value: Attachment[];
  onChange: (value: Attachment[]) => void;
  folder: string;
  max?: number;
}

const SAFE_NAME = /[^a-zA-Z0-9._-]+/g;

/** Uploads PDFs and images (up to 10 MB each) that are attached to official content. */
export function FilesField({ label, value, onChange, folder, max = 5 }: FilesFieldProps) {
  const { files } = useServices();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(file: File) {
    setError(null);
    if (!(UPLOAD.allowedAttachmentTypes as readonly string[]).includes(file.type)) {
      setError("Attach a PDF, JPG, PNG or WebP file.");
      return;
    }
    if (file.size > UPLOAD.maxAttachmentBytes) {
      setError("Files can be at most 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const path = `${folder}/${Date.now()}-${randomFileId()}-${file.name.replace(SAFE_NAME, "_")}`;
      const uploaded = await files.upload(path, file, file.type);
      onChange([...value, { name: file.name, url: uploaded.url, path: uploaded.path }]);
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-800">{label}</p>
      {value.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {value.map((file) => (
            <li key={file.path} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
              <FileText className="size-4 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => {
                  void files.remove(file.path).catch(() => undefined);
                  onChange(value.filter((f) => f.path !== file.path));
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < max && (
        <>
          <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50">
            {busy ? <Spinner className="size-4" /> : <Paperclip className="size-4" aria-hidden="true" />}
            {busy ? "Uploading…" : "Attach a file"}
          </label>
          <input
            id={id}
            type="file"
            className="sr-only"
            disabled={busy}
            accept={UPLOAD.allowedAttachmentTypes.join(",")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void add(file);
            }}
          />
        </>
      )}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
