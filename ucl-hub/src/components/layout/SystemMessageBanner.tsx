"use client";

import { Info } from "lucide-react";
import { useServices } from "@/components/providers/ServicesProvider";
import { useAsyncData } from "@/hooks/useAsyncData";

/** Notice set by an administrator in Settings (planned maintenance, exam-week hours...). Hidden when empty. */
export function SystemMessageBanner() {
  const { settings } = useServices();
  const { data } = useAsyncData(() => settings.get(), [settings]);
  const message = data?.systemMessage.trim();
  if (!message) return null;
  return (
    <div role="status" className="flex items-start gap-3 bg-brand-800 px-4 py-2.5 text-sm text-white">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
    </div>
  );
}
