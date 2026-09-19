"use client";

import { useState } from "react";
import { z } from "zod";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { Feedback } from "@/types";
import { formatDate } from "@/utils/dates";
import { toUserMessage } from "@/utils/errors";
import { humanize } from "@/utils/text";

const noForm = z.object({});

export default function AdminFeedbackPage() {
  const { feedback } = useServices();
  const toast = useToast();
  const [version, setVersion] = useState(0);

  return (
    <RequireCapability capability="feedback">
      <ResourceManager<Feedback, z.infer<typeof noForm>>
        title="Feedback"
        description="Suggestions, content problems and bug reports from students."
        singular="feedback"
        fields={[]}
        schema={noForm}
        loadPage={(cursor) => feedback.listAll(cursor)}
        loadDeps={[feedback, version]}
        remove={(item) => feedback.remove(item.id)}
        searchText={(f) => [f.message, f.category, f.from.name]}
        deleteMessage={() => "This feedback will be permanently deleted."}
        extraActions={[
          {
            label: "Mark reviewed",
            show: (f) => f.status === "new",
            onClick: (f) => {
              feedback
                .markReviewed(f.id)
                .then(() => {
                  toast.success("Marked as reviewed.");
                  setVersion((v) => v + 1);
                })
                .catch((error: unknown) => toast.error(toUserMessage(error)));
            },
          },
        ]}
        columns={[
          {
            header: "Message",
            render: (f) => (
              <div className="min-w-64 max-w-lg">
                <p className="whitespace-pre-line text-slate-800">{f.message}</p>
                <p className="mt-1 text-xs text-slate-500">{f.from.name} · {formatDate(f.createdAt)}</p>
              </div>
            ),
          },
          { header: "Category", render: (f) => <Badge>{humanize(f.category)}</Badge> },
          { header: "Status", render: (f) => (f.status === "new" ? <Badge tone="warning">New</Badge> : <Badge tone="success">Reviewed</Badge>) },
        ]}
      />
    </RequireCapability>
  );
}
