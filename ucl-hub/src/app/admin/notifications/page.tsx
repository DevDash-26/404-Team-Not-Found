"use client";

import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { broadcastSchema, type BroadcastInput } from "@/features/notifications/schema";
import { useActor } from "@/hooks/useActor";
import { describeAudience } from "@/lib/audience";
import { emitNotificationsChanged } from "@/lib/appEvents";
import { NOTIFICATION_TYPES, type AppNotification } from "@/types";
import { formatDateTime } from "@/utils/dates";
import { humanize } from "@/utils/text";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", type: "text", required: true, maxLength: 140 },
  { name: "body", label: "Message", type: "textarea", required: true, rows: 3, maxLength: 240, hint: "Keep it short. Students see this in their notification list." },
  { name: "type", label: "Type", type: "select", required: true, span: 1, options: toOptions(NOTIFICATION_TYPES) },
  { name: "link", label: "Opens page", type: "text", required: true, span: 1, placeholder: "/events", hint: "An in-app path, such as /events or /calendar." },
  { name: "audience", label: "Send to", type: "audience" },
];

export default function AdminNotificationsPage() {
  const { notifications } = useServices();
  const actor = useActor();

  return (
    <RequireCapability capability="notifications">
      <ResourceManager<AppNotification, BroadcastInput>
        title="Notifications"
        description="Send a notification to everyone, or only to a faculty, programme or year. Personal updates (bookings, issues) are sent automatically."
        singular="notification"
        fields={FIELDS}
        schema={broadcastSchema}
        defaults={{ type: "announcement", link: "/announcements" }}
        modalSize="md"
        loadPage={(cursor) => notifications.listAll(cursor)}
        loadDeps={[notifications]}
        create={async (input) => {
          await notifications.broadcast(input, actor);
          emitNotificationsChanged();
        }}
        remove={(item) => notifications.remove(item.id)}
        canDelete={() => true}
        searchText={(n) => [n.title, n.body, n.type]}
        deleteMessage={() => "It will disappear from every student's notification list."}
        columns={[
          {
            header: "Notification",
            render: (n) => (
              <div className="min-w-56 max-w-md">
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>
              </div>
            ),
          },
          { header: "Type", render: (n) => <Badge tone={n.type === "emergency" ? "danger" : "neutral"}>{humanize(n.type)}</Badge> },
          { header: "Sent to", render: (n) => <span className="text-slate-600">{n.recipientId ? "One student" : describeAudience(n.audience)}</span> },
          { header: "Sent", render: (n) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(n.createdAt)}</span> },
        ]}
      />
    </RequireCapability>
  );
}
