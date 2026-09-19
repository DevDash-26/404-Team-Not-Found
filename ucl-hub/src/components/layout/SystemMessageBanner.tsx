"use client";

import { Megaphone } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useAsyncData } from "@/hooks/useAsyncData";

/** Moving headline for the newest active announcement. Hidden until news is published. */
export function SystemMessageBanner() {
  const { announcements } = useServices();
  const { profile } = useAuth();
  const { data, reload } = useAsyncData(() => announcements.listForProfile(profile, undefined, 10), [announcements, profile?.id]);
  useEffect(() => {
    const interval = window.setInterval(reload, 30_000);
    return () => window.clearInterval(interval);
  }, [reload]);
  const announcement = data?.items.find((item) => item.priority !== "emergency");
  if (!announcement) return null;

  const headline = `${announcement.title} - ${announcement.description}`;

  return (
    <div role="status" aria-label={`Latest news: ${headline}`} className="news-ticker border-y border-brand-200/70 bg-brand-50/90 text-brand-950 dark:border-brand-700/50 dark:bg-brand-950/80 dark:text-brand-50">
      <Link href="/announcements" className="flex min-w-0 items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-brand-100/70 dark:hover:bg-brand-900/70">
        <Megaphone className="size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
        <span className="sr-only">Latest news: </span>
        <span className="news-ticker__viewport min-w-0 flex-1" aria-hidden="true">
          <span className="news-ticker__track">
            <span>{headline}</span>
            <span aria-hidden="true">{headline}</span>
          </span>
        </span>
      </Link>
    </div>
  );
}
