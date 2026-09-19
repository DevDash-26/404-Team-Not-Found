"use client";

import { AlertOctagon, Info, Megaphone, Paperclip, Users } from "lucide-react";
import { useState } from "react";
import { AnnouncementPriorityBadge } from "@/components/common/StatusBadges";
import { Badge } from "@/components/ui/Badge";
import { describeAudience, isEveryone } from "@/lib/audience";
import type { Announcement } from "@/types";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

const LONG_TEXT = 240;

const STYLE = {
  emergency: { card: "border-red-300 bg-red-50 ring-1 ring-red-200", bar: "bg-red-600", icon: AlertOctagon, iconColour: "text-red-600" },
  important: { card: "border-amber-200 bg-amber-50/40", bar: "bg-amber-500", icon: Info, iconColour: "text-amber-600" },
  normal: { card: "border-slate-200 bg-white", bar: "bg-brand-200", icon: Megaphone, iconColour: "text-brand-600" },
} as const;

/** One announcement. Emergency and important ones are visually distinct (colour, icon and label, not colour alone). */
export function AnnouncementCard({ announcement, showAudience = false }: { announcement: Announcement; showAudience?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const style = STYLE[announcement.priority];
  const Icon = style.icon;
  const long = announcement.description.length > LONG_TEXT;

  return (
    <article className={cn("relative overflow-hidden rounded-xl border shadow-card", style.card)}>
      <span className={cn("absolute inset-y-0 left-0 w-1.5", style.bar)} aria-hidden="true" />
      <div className="py-4 pl-6 pr-5">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className={cn("size-4", style.iconColour)} aria-hidden="true" />
          <AnnouncementPriorityBadge priority={announcement.priority} />
          <Badge tone="brand">{humanize(announcement.category)}</Badge>
          <span className="ml-auto text-xs text-slate-500">{formatDate(announcement.createdAt)}</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-slate-900">{announcement.title}</h3>
        <p className={cn("mt-1 whitespace-pre-line text-sm text-slate-700", !expanded && long && "line-clamp-3")}>{announcement.description}</p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="mt-1 text-sm font-medium text-brand-700 hover:underline">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {announcement.attachments.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {announcement.attachments.map((file) => (
              <li key={file.path || file.url}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">
                  <Paperclip className="size-3.5" aria-hidden="true" />
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>From {announcement.source}</span>
          {showAudience && !isEveryone(announcement.audience) && (
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {describeAudience(announcement.audience)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
