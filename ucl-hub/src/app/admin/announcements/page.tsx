"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { AnnouncementPriorityBadge } from "@/components/common/StatusBadges";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { useActor } from "@/hooks/useActor";
import { describeAudience } from "@/lib/audience";
import { announcementSchema, type AnnouncementInput } from "@/features/announcements/schema";
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_PRIORITIES, type Announcement } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true, maxLength: 140 },
  { name: "description", label: "Announcement", type: "textarea", required: true, rows: 6, maxLength: 4000 },
  { name: "category", label: "Category", type: "select", required: true, span: 1, options: toOptions(ANNOUNCEMENT_CATEGORIES) },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    span: 1,
    options: toOptions(ANNOUNCEMENT_PRIORITIES),
    hint: "Emergency announcements appear as a red banner on every student's screen.",
  },
  { name: "source", label: "Source office", type: "text", required: true, span: 1, placeholder: "e.g. Registrar's Office" },
  { name: "expiresAt", label: "Stop showing on", type: "datetime", span: 1, nullable: true, hint: "Optional. Leave empty to keep it visible." },
  { name: "audience", label: "Who is this for?", type: "audience" },
  { name: "attachments", label: "Attachments", type: "files", folder: "content/announcements", max: 5 },
];

export default function AdminAnnouncementsPage() {
  const { announcements } = useServices();
  const actor = useActor();

  return (
    <RequireCapability capability="announcements">
      <ResourceManager<Announcement, AnnouncementInput>
        title="Announcements"
        description="Publish official news. Target it to a faculty, programme or year so students only see what is relevant."
        singular="announcement"
        fields={FIELDS}
        schema={announcementSchema}
        defaults={{ category: "general", priority: "normal" }}
        loadPage={(cursor) => announcements.listAll(cursor)}
        loadDeps={[announcements]}
        create={(input) => announcements.create(input, actor)}
        update={(item, input) => announcements.update(item.id, input)}
        remove={(item) => announcements.remove(item.id)}
        searchText={(a) => [a.title, a.description, a.source, a.category]}
        deleteMessage={(a) => `"${a.title}" will disappear for every student.`}
        columns={[
          {
            header: "Announcement",
            render: (a) => (
              <div className="min-w-56 max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{a.title}</span>
                  <AnnouncementPriorityBadge priority={a.priority} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{a.source}</p>
              </div>
            ),
          },
          { header: "Category", render: (a) => <Badge>{humanize(a.category)}</Badge> },
          { header: "Audience", render: (a) => <span className="text-slate-600">{describeAudience(a.audience)}</span> },
          { header: "Posted", render: (a) => <span className="whitespace-nowrap text-slate-600">{formatDate(a.createdAt)}</span> },
          { header: "Expires", render: (a) => <span className="whitespace-nowrap text-slate-600">{a.expiresAt ? formatDate(a.expiresAt) : "—"}</span> },
        ]}
      />
    </RequireCapability>
  );
}
