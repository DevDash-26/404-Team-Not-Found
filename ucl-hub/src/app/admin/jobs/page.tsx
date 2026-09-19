"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { isJobOpen } from "@/features/jobs/logic";
import { jobSchema, type JobInput } from "@/features/jobs/schema";
import { useActor } from "@/hooks/useActor";
import { useNow } from "@/hooks/useNow";
import { JOB_TYPES, type Job } from "@/types";
import { humanize } from "@/utils/text";

const FIELDS: FieldDef[] = [
  { name: "position", label: "Position", type: "text", required: true, span: 1 },
  { name: "company", label: "Company", type: "text", required: true, span: 1 },
  { name: "type", label: "Type", type: "select", required: true, span: 1, options: toOptions(JOB_TYPES) },
  { name: "location", label: "Location", type: "text", required: true, span: 1 },
  { name: "deadline", label: "Apply by", type: "date", required: true, span: 1 },
  { name: "applyUrl", label: "Application link", type: "url", required: true, span: 1, placeholder: "https://" },
  { name: "description", label: "Description", type: "textarea", required: true, rows: 5, maxLength: 4000 },
  { name: "skills", label: "Skills", type: "tags", placeholder: "React, TypeScript, SQL" },
];

export default function AdminJobsPage() {
  const { jobs } = useServices();
  const actor = useActor();
  const now = useNow();
  return (
    <RequireCapability capability="jobs">
      <ResourceManager<Job, JobInput>
        title="Jobs & internships"
        description="Post opportunities from employers and partners. Expired listings are hidden from students automatically."
        singular="listing"
        fields={FIELDS}
        schema={jobSchema}
        defaults={{ type: "internship" }}
        loadPage={(cursor) => jobs.list(cursor)}
        loadDeps={[jobs]}
        create={(input) => jobs.create(input, actor)}
        update={(item, input) => jobs.update(item.id, input)}
        remove={(item) => jobs.remove(item.id)}
        searchText={(j) => [j.position, j.company, j.location, ...j.skills]}
        columns={[
          {
            header: "Listing",
            render: (j) => (
              <div className="min-w-48">
                <p className="font-medium text-slate-900">{j.position}</p>
                <p className="text-xs text-slate-500">{j.company} · {j.location}</p>
              </div>
            ),
          },
          { header: "Type", render: (j) => <Badge>{humanize(j.type)}</Badge> },
          { header: "Deadline", render: (j) => <span className="whitespace-nowrap text-slate-700">{j.deadline}</span> },
          { header: "Status", render: (j) => (isJobOpen(j, now) ? <Badge tone="success">Open</Badge> : <Badge tone="neutral">Closed</Badge>) },
        ]}
      />
    </RequireCapability>
  );
}
