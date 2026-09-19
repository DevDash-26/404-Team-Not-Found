"use client";

import { ArrowRight, DoorOpen, GraduationCap, MessageSquareText, PackageSearch, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Skeleton } from "@/components/ui/States";
import type { QueueKey } from "@/features/analytics/service";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { Capability } from "@/lib/permissions";

interface QueueTile {
  key: QueueKey;
  capability: Capability;
  href: string;
  icon: LucideIcon;
  label: string;
  /** What to say when the queue is empty. */
  clear: string;
}

const TILES: readonly QueueTile[] = [
  { key: "bookings", capability: "bookings", href: "/admin/bookings", icon: DoorOpen, label: "Booking requests to review", clear: "No bookings waiting" },
  { key: "facilityIssues", capability: "facilityIssues", href: "/admin/facility-issues", icon: Wrench, label: "Open facility issues", clear: "No open issues" },
  { key: "lostFound", capability: "lostFoundModeration", href: "/admin/lost-found", icon: PackageSearch, label: "Open lost & found posts", clear: "Board is clear" },
  { key: "support", capability: "academicSupport", href: "/admin/academic-support", icon: GraduationCap, label: "Students waiting for a match", clear: "Nobody waiting" },
  { key: "feedback", capability: "feedback", href: "/admin/feedback", icon: MessageSquareText, label: "New feedback", clear: "All reviewed" },
  { key: "assistant", capability: "knowledge", href: "/admin/assistant", icon: Sparkles, label: "Questions the AI couldn't answer", clear: "Nothing unanswered" },
];

function Tile({ tile }: { tile: QueueTile }) {
  const { analytics } = useServices();
  const { data, loading, error } = useAsyncData(() => analytics.queueCount(tile.key), [analytics, tile.key]);
  const Icon = tile.icon;
  const waiting = data !== null && data > 0;

  return (
    <Link
      href={tile.href}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:border-brand-300 hover:shadow-md"
    >
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${waiting ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700"}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        {loading ? (
          <Skeleton className="h-7 w-10" />
        ) : (
          <span className="block text-2xl font-semibold tabular-nums text-slate-900">{error ? "–" : data}</span>
        )}
        <span className="block text-sm text-slate-600">{error ? "Couldn't load" : waiting ? tile.label : tile.clear}</span>
      </span>
      <ArrowRight className="size-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden="true" />
    </Link>
  );
}

/** What is waiting for this staff member, limited to the areas their role manages. */
export function AdminWorkQueue() {
  const { can } = useAuth();
  const tiles = TILES.filter((tile) => can(tile.capability));
  if (tiles.length === 0) return null;
  return (
    <section aria-labelledby="queue-heading">
      <h2 id="queue-heading" className="mb-3 text-base font-semibold text-slate-900">
        Needs your attention
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Tile key={tile.key} tile={tile} />
        ))}
      </div>
    </section>
  );
}

