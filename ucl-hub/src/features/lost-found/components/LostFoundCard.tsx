"use client";

import { Calendar, Mail, MapPin, Phone, Store } from "lucide-react";
import { LostFoundStatusBadge } from "@/components/common/StatusBadges";
import { MetaLine } from "@/components/common/MetaLine";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import type { LostFoundItem, LostFoundStatus } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

const ACTION_LABELS: Record<LostFoundStatus, string> = { open: "Reopen", claimed: "Mark as claimed", resolved: "Mark as resolved" };

interface LostFoundCardProps {
  item: LostFoundItem;
  /** Statuses the current user may move this item to (empty when they cannot manage it). */
  actions: LostFoundStatus[];
  busy: boolean;
  onStatus: (item: LostFoundItem, status: LostFoundStatus) => void;
  onMatches?: (item: LostFoundItem) => void;
}

function ContactLine({ item }: { item: LostFoundItem }) {
  const { type, value } = item.contact;
  if (type === "email") {
    return (
      <MetaLine icon={Mail}>
        <a className="text-brand-700 hover:underline" href={`mailto:${value}`}>
          {value}
        </a>
      </MetaLine>
    );
  }
  if (type === "phone") {
    return (
      <MetaLine icon={Phone}>
        <a className="text-brand-700 hover:underline" href={`tel:${value.replace(/\s/g, "")}`}>
          {value}
        </a>
      </MetaLine>
    );
  }
  return <MetaLine icon={Store}>Via the Student Affairs front desk</MetaLine>;
}

export function LostFoundCard({ item, actions, busy, onStatus, onMatches }: LostFoundCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden">
      {item.imageUrl && <SmartImage src={item.imageUrl} alt={`Photo of ${item.title}`} className="h-40 w-full" />}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={item.type === "lost" ? "danger" : "success"}>{item.type === "lost" ? "Lost" : "Found"}</Badge>
          <Badge tone="brand">{humanize(item.category)}</Badge>
          <LostFoundStatusBadge status={item.status} />
        </div>
        <h3 className="font-semibold text-slate-900">{item.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.description}</p>
        <div className="mt-3 space-y-1.5">
          <MetaLine icon={MapPin}>{item.location}</MetaLine>
          <MetaLine icon={Calendar}>{formatDate(item.date)}</MetaLine>
          <ContactLine item={item} />
        </div>
        <p className="mt-2 text-xs text-slate-500">Posted by {item.reporter.name}</p>
        <div className="mt-4 flex-1" />
        <div className="flex flex-wrap gap-2">
          {actions.map((status) => (
            <Button key={status} size="sm" variant={status === "open" ? "ghost" : "secondary"} loading={busy} onClick={() => onStatus(item, status)}>
              {ACTION_LABELS[status]}
            </Button>
          ))}
          {onMatches && item.status === "open" && (
            <Button size="sm" variant="ghost" onClick={() => onMatches(item)}>
              Possible matches
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
