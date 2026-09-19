"use client";

import { useCallback, useMemo, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { SupportStatusBadge } from "@/components/common/StatusBadges";
import { DataTable } from "@/components/admin/DataTable";
import { DynamicForm } from "@/components/admin/DynamicForm";
import type { FieldDef } from "@/components/admin/fields";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useActor } from "@/hooks/useActor";
import { usePagedList } from "@/hooks/usePagedList";
import { emitNotificationsChanged } from "@/lib/appEvents";
import { fetchFilteredPage } from "@/services/paging";
import type { SupportRequest, SupportStatus } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { canTransitionSupport, nextSupportStatuses } from "../logic";
import { supportDecisionSchema, type SupportDecisionInput } from "../schema";

type Filter = SupportStatus | "all";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "open", label: "Waiting" },
  { value: "matched", label: "Matched" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

function decisionFields(request: SupportRequest): FieldDef[] {
  const statuses: SupportStatus[] = [request.status, ...nextSupportStatuses(request.status)];
  return [
    { name: "status", label: "Status", type: "select", required: true, options: statuses.map((s) => ({ value: s, label: humanize(s) })), hint: "Choose “Matched” once you've found a tutor, group or mentor." },
    { name: "matchedName", label: "Matched with", type: "text", span: 1, placeholder: "Tutor, group or mentor name" },
    { name: "matchedEmail", label: "Their email", type: "email", span: 1 },
    { name: "staffNote", label: "Note for the student", type: "textarea", rows: 3, maxLength: 500, hint: "They will see this in their notification." },
  ];
}

/** Staff matching workflow for peer tutoring, study groups and mentorship requests. */
export function SupportQueue() {
  const { support } = useServices();
  const toast = useToast();
  const staff = useActor();
  const [filter, setFilter] = useState<Filter>("open");
  const [selected, setSelected] = useState<SupportRequest | null>(null);

  const load = useCallback(
    (cursor: unknown | undefined) =>
      fetchFilteredPage({
        fetchPage: (next) => support.listAll(next),
        predicate: (request) => filter === "all" || request.status === filter,
        target: 10,
        cursor,
      }),
    [support, filter],
  );
  const list = usePagedList<SupportRequest>(load, [load]);
  const fields = useMemo(() => (selected ? decisionFields(selected) : []), [selected]);

  async function save(input: SupportDecisionInput) {
    if (!selected) return;
    await support.decide(selected, input, staff);
    toast.success("Saved. The student has been notified.");
    emitNotificationsChanged();
    setSelected(null);
    list.reload();
  }

  const canAct = (request: SupportRequest) => canTransitionSupport(request.status, "matched") || canTransitionSupport(request.status, "closed");

  return (
    <>
      <FilterChips<Filter> label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} className="mb-4" />
      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingRows />
      ) : list.items.length === 0 ? (
        <EmptyState title="No requests here" description={filter === "open" ? "No student is waiting for a match right now." : "Try a different filter."} />
      ) : (
        <DataTable
          caption="Academic support requests"
          rows={list.items}
          columns={[
            {
              header: "Request",
              render: (r) => (
                <div className="min-w-56 max-w-md">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{r.subject}</span>
                    <Badge tone="brand">{humanize(r.type)}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.description}</p>
                  {r.preferredTimes && <p className="mt-1 text-xs text-slate-500">Prefers: {r.preferredTimes}</p>}
                </div>
              ),
            },
            {
              header: "Student",
              render: (r) => (
                <div className="whitespace-nowrap">
                  <p className="text-slate-800">{r.requester.name}</p>
                  <p className="text-xs text-slate-500">{[r.programme, r.year ? `Year ${r.year}` : null].filter(Boolean).join(" · ") || "—"}</p>
                </div>
              ),
            },
            {
              header: "Status",
              render: (r) => (
                <div className="space-y-1">
                  <SupportStatusBadge status={r.status} />
                  {r.matchedWith && <p className="text-xs text-slate-600">with {r.matchedWith.name}</p>}
                  <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                </div>
              ),
            },
          ]}
          actions={(request) =>
            canAct(request) ? (
              <Button size="sm" onClick={() => setSelected(request)}>
                {request.status === "open" ? "Match or close" : "Update"}
              </Button>
            ) : null
          }
        />
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <Modal open={selected !== null} onClose={() => setSelected(null)} title="Update support request" description={selected ? `${humanize(selected.type)} for ${selected.requester.name}` : undefined} size="md">
        {selected && (
          <DynamicForm<SupportDecisionInput>
            fields={fields}
            schema={supportDecisionSchema}
            item={{ status: selected.status, matchedName: selected.matchedWith?.name ?? "", matchedEmail: selected.matchedWith?.email ?? "", staffNote: selected.staffNote }}
            submitLabel="Save"
            onCancel={() => setSelected(null)}
            onSubmit={save}
          />
        )}
      </Modal>
    </>
  );
}
