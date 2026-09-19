import { Building2, CalendarClock, ExternalLink, MapPin } from "lucide-react";
import { MetaLine } from "@/components/common/MetaLine";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Job } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { daysLeft, isJobOpen } from "../logic";

export function JobCard({ job, now }: { job: Job; now: Date }) {
  const open = isJobOpen(job, now);
  const left = daysLeft(job, now);
  const urgent = open && left <= 3;

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">{humanize(job.type)}</Badge>
        {!open && <Badge>Closed</Badge>}
        {urgent && <Badge tone="warning">{left <= 0 ? "Closes today" : `${left} ${left === 1 ? "day" : "days"} left`}</Badge>}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{job.position}</h3>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <Building2 className="size-4 text-slate-400" aria-hidden="true" />
        {job.company}
      </p>
      <p className="mt-2 line-clamp-3 text-sm text-slate-600">{job.description}</p>
      <div className="mt-3 space-y-1.5">
        <MetaLine icon={MapPin}>{job.location}</MetaLine>
        <MetaLine icon={CalendarClock}>Apply by {formatDate(job.deadline)}</MetaLine>
      </div>
      {job.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Skills">
          {job.skills.map((skill) => (
            <li key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
              {skill}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex-1" />
      {open ? (
        <LinkButton href={job.applyUrl} icon={<ExternalLink className="size-4" aria-hidden="true" />} className="w-full">
          Apply
        </LinkButton>
      ) : (
        <p className="text-center text-sm text-slate-500">Applications have closed.</p>
      )}
    </Card>
  );
}
