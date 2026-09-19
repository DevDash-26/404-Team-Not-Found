import { CalendarDays, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Society } from "@/types";
import { formatDateTime } from "@/utils/dates";
import { initials, humanize } from "@/utils/text";
import { upcomingActivities } from "../logic";

interface SocietyCardProps {
  society: Society;
  joined: boolean;
  now: Date;
  busy: boolean;
  onJoin: (society: Society) => void;
  onLeave: (society: Society) => void;
}

export function SocietyCard({ society, joined, now, busy, onJoin, onLeave }: SocietyCardProps) {
  const next = upcomingActivities(society, now)[0];
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
          style={{ backgroundColor: society.colour }}
        >
          {initials(society.name)}
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{society.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{humanize(society.category)}</Badge>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="size-3.5" aria-hidden="true" />
              {society.memberCount} members · {society.interestCount} interested
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600">{society.description}</p>
      {next && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">
          <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium">Next: {next.title}</span>
            <br />
            {formatDateTime(next.date)} · {next.location}
          </span>
        </p>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
        <Mail className="size-4 text-slate-400" aria-hidden="true" />
        <a className="text-brand-700 hover:underline" href={`mailto:${society.contactEmail}`}>
          {society.contactEmail}
        </a>
      </p>
      <div className="mt-4 flex-1" />
      {joined ? (
        <Button variant="secondary" className="w-full" loading={busy} onClick={() => onLeave(society)}>
          You&apos;ve asked to join ✓ (withdraw)
        </Button>
      ) : (
        <Button className="w-full" loading={busy} onClick={() => onJoin(society)}>
          Ask to join
        </Button>
      )}
    </Card>
  );
}
