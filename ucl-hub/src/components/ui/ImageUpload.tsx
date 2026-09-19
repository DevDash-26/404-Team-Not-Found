"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import { UPLOAD } from "@/config/app";
import { downscaleImage, randomFileId } from "@/utils/image";
import { toUserMessage } from "@/utils/errors";
import { Button } from "./Button";
import { SmartImage } from "./SmartImage";
import { Spinner } from "./States";

export interface UploadedImage {
  url: string;
  path: string;
}

interface ImageUploadProps {
  label: string;
  value: UploadedImage | null;
  onChange: (value: UploadedImage | null) => void;
  /** Storage folder for new files, e.g. `uploads/<uid>/lost-found` or `content/events`. */
  folder: string;
  hint?: string;
}

const RAW_LIMIT_BYTES = 25 * 1024 * 1024;

/** Picks an image, shrinks it in the browser, uploads it and reports where it is stored. */
export function ImageUpload({ label, value, onChange, folder, hint }: ImageUploadProps) {
  const { files } = useServices();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!(UPLOAD.allowedImageTypes as readonly string[]).includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > RAW_LIMIT_BYTES) {
      setError("That image is too large. Please choose one under 25 MB.");
      return;
    }
    setBusy(true);
    try {
      const blob = await downscaleImage(file, UPLOAD.imageMaxDimension, UPLOAD.imageQuality);
      if (blob.size > UPLOAD.maxImageBytes) {
        setError("That image is still too large after resizing. Try a simpler picture.");
        return;
      }
      const path = `${folder}/${Date.now()}-${randomFileId()}.jpg`;
      const uploaded = await files.upload(path, blob, "image/jpeg");
      if (value) void files.remove(value.path).catch(() => undefined);
      onChange({ url: uploaded.url, path: uploaded.path });
    } catch (e) {
      setError(toUserMessage(e));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-800">
        {label}
      </label>
      {value ? (
        <div className="flex items-center gap-3">
          <SmartImage src={value.url} alt="Uploaded preview" className="size-20 rounded-lg border border-slate-200" />
          <Button
            variant="secondary"
            size="sm"
            icon={<Trash2 className="size-4" aria-hidden="true" />}
            onClick={() => {
              void files.remove(value.path).catch(() => undefined);
              onChange(null);
            }}
          >
            Remove
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50"
        >
          {busy ? <Spinner className="size-4" /> : <ImagePlus className="size-4" aria-hidden="true" />}
          {busy ? "Uploading…" : "Add a photo (optional)"}
        </label>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={UPLOAD.allowedImageTypes.join(",")}
        disabled={busy}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
