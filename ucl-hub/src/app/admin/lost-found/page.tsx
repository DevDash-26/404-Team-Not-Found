"use client";

import { useCallback, useState } from "react";
import { LostFoundStatusBadge } from "@/components/common/StatusBadges";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { ResourceManager, type RowAction } from "@/components/admin/ResourceManager";
import { nextLostFoundStatuses } from "@/features/lost-found/logic";
import { fetchFilteredPage } from "@/services/paging";
import type { LostFoundItem, LostFoundStatus } from "@/types";
import { formatDate, parseDateKey } from "@/utils/dates";
import { toUserMessage } from "@/utils/errors";
import { humanize } from "@/utils/text";
import { z } from "zod";

type Filter = LostFoundStatus | "all";
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "open", label: "Open" },
  { value: "claimed", label: "Claimed" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

// Moderation only changes status or removes posts, so there is no edit form.
const noForm = z.object({});

export default function AdminLostFoundPage() {
  const { lostFound } = useServices();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("open");
  const [version, setVersion] = useState(0);

  const move = useCallback(
    async (item: LostFoundItem, status: LostFoundStatus) => {
      try {
        await lostFound.updateStatus(item, status);
        toast.success(`Marked as ${status}.`);
        setVersion((v) => v + 1);
      } catch (error) {
        toast.error(toUserMessage(error));
      }
    },
    [lostFound, toast],
  );

  const actions: RowAction<LostFoundItem>[] = [
    { label: "Mark claimed", onClick: (item) => void move(item, "claimed"), show: (item) => nextLostFoundStatuses(item.status).includes("claimed") },
    { label: "Reopen", onClick: (item) => void move(item, "open"), show: (item) => item.status === "claimed" },
    { label: "Mark resolved", onClick: (item) => void move(item, "resolved"), show: (item) => nextLostFoundStatuses(item.status).includes("resolved") },
  ];

  return (
    <RequireCapability capability="lostFoundModeration">
      <ResourceManager<LostFoundItem, z.infer<typeof noForm>>
        title="Lost & found"
        description="Keep the board tidy: mark items claimed or resolved, and remove anything inappropriate."
        singular="post"
        fields={[]}
        schema={noForm}
        loadPage={(cursor) =>
          fetchFilteredPage({
            fetchPage: (next) => lostFound.listAll(next),
            predicate: (item) => filter === "all" || item.status === filter,
            target: 10,
            cursor,
          })
        }
        loadDeps={[lostFound, filter, version]}
        remove={(item) => lostFound.remove(item.id)}
        searchText={(i) => [i.title, i.description, i.location, i.category, i.reporter.name]}
        deleteMessage={(i) => `"${i.title}" will be removed from the board.`}
        extraActions={actions}
        toolbar={<FilterChips<Filter> label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} />}
        columns={[
          {
            header: "Item",
            render: (i) => (
              <div className="min-w-56 max-w-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{i.title}</span>
                  <Badge tone={i.type === "lost" ? "warning" : "info"}>{humanize(i.type)}</Badge>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{i.description}</p>
              </div>
            ),
          },
          { header: "Where & when", render: (i) => <div className="whitespace-nowrap"><p className="text-slate-700">{i.location}</p><p className="text-xs text-slate-500">{formatDate(parseDateKey(i.date) ?? i.createdAt)}</p></div> },
          { header: "Reported by", render: (i) => <span className="text-slate-600">{i.reporter.name}</span> },
          { header: "Status", render: (i) => <LostFoundStatusBadge status={i.status} /> },
        ]}
      />
    </RequireCapability>
  );
}
