import { CalendarDays, MapPin, Users } from "lucide-react";
import { MetaLine } from "@/components/common/MetaLine";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import type { CampusEvent } from "@/types";
import { formatDateTime, formatTime, relativeDay } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { canRegisterInterest, eventStatus, isFull, spotsLeft } from "../logic";

interface EventCardProps {
  event: CampusEvent;
  interested: boolean;
  now: Date;
  busy: boolean;
  onToggleInterest: (event: CampusEvent, interested: boolean) => void;
}

export function EventCard({ event, interested, now, busy, onToggleInterest }: EventCardProps) {
  const status = eventStatus(event, now);
  const left = spotsLeft(event);
  const check = canRegisterInterest(event, interested, now);
  const disabledReason = !interested && !check.ok ? check.reason : null;

  return (
    <Card className="flex flex-col overflow-hidden">
      {event.imageUrl ? (
        <SmartImage src={event.imageUrl} alt="" className="h-36 w-full" />
      ) : (
        <div className="h-2 bg-gradient-to-r from-brand-700 to-accent-400" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{humanize(event.category)}</Badge>
          {status === "ongoing" && <Badge tone="success">Happening now</Badge>}
          {status === "past" && <Badge>Finished</Badge>}
          {status === "upcoming" && <Badge tone="accent">{relativeDay(event.startsAt, now)}</Badge>}
          {isFull(event) && <Badge tone="danger">Full</Badge>}
        </div>
        <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
        <p className="mt-1 line-clamp-3 text-sm text-slate-600">{event.description}</p>

        <div className="mt-3 space-y-1.5">
          <MetaLine icon={CalendarDays}>
            {formatDateTime(event.startsAt)} – {formatTime(event.endsAt)}
          </MetaLine>
          <MetaLine icon={MapPin}>{event.location}</MetaLine>
          <MetaLine icon={Users}>
            {event.interestCount} interested{left !== null ? ` · ${left} ${left === 1 ? "spot" : "spots"} left` : ""} · by {event.organiser}
          </MetaLine>
        </div>

        <div className="mt-4 flex-1" />
        {status !== "past" && (
          <>
            <Button
              variant={interested ? "secondary" : "primary"}
              className="w-full"
              loading={busy}
              disabled={disabledReason !== null}
              aria-pressed={interested}
              onClick={() => onToggleInterest(event, interested)}
            >
              {interested ? "Interested ✓ (tap to cancel)" : "I'm interested"}
            </Button>
            {disabledReason && <p className="mt-1.5 text-center text-xs text-slate-500">{disabledReason}</p>}
          </>
        )}
      </div>
    </Card>
  );
}
