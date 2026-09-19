"use client";

import { Siren, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useAsyncData } from "@/hooks/useAsyncData";

/** Pinned, high-contrast banner for the current emergency announcement (if any). */
export function EmergencyBanner() {
  const { announcements } = useServices();
  const { profile } = useAuth();
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const { data: emergency } = useAsyncData(() => announcements.getActiveEmergency(profile), [announcements, profile?.id]);

  if (!emergency || emergency.id === dismissedId) return null;
  return (
    <div role="alert" className="flex items-start gap-3 bg-red-700 px-4 py-3 text-white">
      <Siren className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm">
        <strong className="font-semibold">Emergency: {emergency.title}.</strong> <span className="line-clamp-2 text-red-50 sm:inline">{emergency.description}</span>{" "}
        <Link href="/announcements" className="font-medium underline underline-offset-2">
          Read more
        </Link>
      </p>
      <button type="button" onClick={() => setDismissedId(emergency.id)} aria-label="Hide emergency banner" className="rounded p-1 hover:bg-red-600">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
