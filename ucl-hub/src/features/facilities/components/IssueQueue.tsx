"use client";

import { useMemo, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { FacilityPriorityBadge, FacilityStatusBadge } from "@/components/common/StatusBadges";
import { DataTable } from "@/components/admin/DataTable";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Button } from "@/components/ui/Button";
import { Checkbox, SelectInput } from "@/components/ui/Field";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagedList } from "@/hooks/usePagedList";
import { FACILITY_CATEGORIES, type FacilityCategory, type FacilityIssue, type FacilityStatus } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";
import { filterIssues, isOpenIssue, issuesForTeam, sortIssues } from "../logic";
import { IssueWorkflowModal } from "./IssueWorkflowModal";

type StatusFilter = "open" | FacilityStatus | "all";

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "open", label: "Open" },
  { value: "submitted", label: "Submitted" },
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

/** Work queue for facilities and IT staff: most urgent open issues first, with a routing-aware default view. */
export function IssueQueue() {
  const { facilities } = useServices();
  const { access } = useCurrentUser();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [category, setCategory] = useState<FacilityCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [otherTeams, setOtherTeams] = useState(false);
  const [selected, setSelected] = useState<FacilityIssue | null>(null);
  const query = useDebouncedValue(search);

  const list = usePagedList<FacilityIssue>((cursor) => facilities.listAll(cursor), [facilities]);
  const routed = access.role === "staff" && (access.staffRole === "facilities" || access.staffRole === "it");

  const rows = useMemo(() => {
    const scoped = routed && !otherTeams ? issuesForTeam(list.items, access.staffRole) : list.items;
    const filtered = filterIssues(scoped, { query, status: status === "open" ? "all" : status, priority: "all", category });
    return sortIssues(status === "open" ? filtered.filter(isOpenIssue) : filtered);
  }, [list.items, routed, otherTeams, access.staffRole, query, status, category]);

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by place, description or reporter" label="Search facility issues" />
          <SelectInput
            label="Category"
            fieldClassName="[&>label]:sr-only"
            value={category}
            onChange={(e) => setCategory(e.target.value as FacilityCategory | "all")}
            options={[{ value: "all", label: "All categories" }, ...FACILITY_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]}
          />
        </div>
        <FilterChips<StatusFilter> label="Filter by status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
        {routed && (
          <Checkbox
            label="Include other teams' issues"
            description={access.staffRole === "it" ? "Your default view shows internet and equipment problems." : "Your default view shows building and room problems."}
            checked={otherTeams}
            onChange={(e) => setOtherTeams(e.target.checked)}
          />
        )}
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingRows />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing to show" description={status === "open" ? "No open issues match. Nice and quiet." : "Try a different filter."} />
      ) : (
        <DataTable
          caption="Facility issues"
          rows={rows}
          columns={[
            {
              header: "Issue",
              render: (i) => (
                <div className="min-w-56 max-w-md">
                  <p className="font-medium text-slate-900">{humanize(i.category)} · {i.location}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{i.description}</p>
                </div>
              ),
            },
            { header: "Priority", render: (i) => <FacilityPriorityBadge priority={i.priority} /> },
            { header: "Status", render: (i) => <FacilityStatusBadge status={i.status} /> },
            {
              header: "Reported",
              render: (i) => (
                <div className="whitespace-nowrap">
                  <p className="text-slate-700">{i.reporter.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(i.createdAt)}</p>
                </div>
              ),
            },
          ]}
          actions={(issue) => (
            <Button size="sm" variant={isOpenIssue(issue) ? "primary" : "secondary"} onClick={() => setSelected(issue)}>
              {isOpenIssue(issue) ? "Update" : "View"}
            </Button>
          )}
        />
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
      <IssueWorkflowModal issue={selected} onChanged={list.reload} onClose={() => setSelected(null)} />
    </>
  );
}
