"use client";

import { PackageSearch, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { SelectInput } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingCards, Spinner } from "@/components/ui/States";
import { LostFoundCard } from "@/features/lost-found/components/LostFoundCard";
import { ReportItemModal } from "@/features/lost-found/components/ReportItemModal";
import { canManageItem, nextLostFoundStatuses, suggestMatches, type LostFoundFilters } from "@/features/lost-found/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagedList } from "@/hooks/usePagedList";
import { LOST_FOUND_CATEGORIES, type LostFoundCategory, type LostFoundItem, type LostFoundStatus, type LostFoundType } from "@/types";
import { toUserMessage } from "@/utils/errors";
import { humanize } from "@/utils/text";

const TYPES = [
  { value: "all", label: "Lost & found" },
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
] as const;

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "claimed", label: "Claimed" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
] as const;

export default function LostFoundPage() {
  const { lostFound } = useServices();
  const { profile } = useCurrentUser();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<LostFoundType | "all">("all");
  const [status, setStatus] = useState<LostFoundStatus | "all">("open");
  const [category, setCategory] = useState<LostFoundCategory | "all">("all");
  const [reportType, setReportType] = useState<LostFoundType | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [matchesFor, setMatchesFor] = useState<LostFoundItem | null>(null);
  const query = useDebouncedValue(search);

  const filters: LostFoundFilters = useMemo(() => ({ query, type, category, status }), [query, type, category, status]);
  const list = usePagedList((cursor) => lostFound.list(filters, cursor), [lostFound, filters]);

  const changeStatus = useCallback(
    async (item: LostFoundItem, next: LostFoundStatus) => {
      setBusyId(item.id);
      try {
        await lostFound.updateStatus(item, next);
        toast.success(`Marked as ${next}.`);
        list.reload();
      } catch (error) {
        toast.error(toUserMessage(error));
      } finally {
        setBusyId(null);
      }
    },
    [lostFound, list, toast],
  );

  return (
    <>
      <PageHeader
        title="Lost & Found"
        description="Search reports from across campus, or post one so your item can find its way back."
        actions={
          <>
            <Button variant="secondary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setReportType("lost")}>
              I lost something
            </Button>
            <Button icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setReportType("found")}>
              I found something
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by item, place or description" label="Search lost and found" />
          <SelectInput
            label="Category"
            fieldClassName="[&>label]:sr-only"
            value={category}
            onChange={(e) => setCategory(e.target.value as LostFoundCategory | "all")}
            options={[{ value: "all", label: "All categories" }, ...LOST_FOUND_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <FilterChips label="Type" options={TYPES} value={type} onChange={setType} />
          <FilterChips label="Status" options={STATUSES} value={status} onChange={setStatus} />
        </div>
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingCards />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-6" aria-hidden="true" />}
          title="Nothing matches your search"
          description={search || category !== "all" || type !== "all" ? "Try different words or clear the filters. If it isn't listed yet, post a report." : "No reports right now."}
          action={
            <Button onClick={() => setReportType("lost")} icon={<Plus className="size-4" aria-hidden="true" />}>
              Report a lost item
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.items.map((item) => (
            <LostFoundCard
              key={item.id}
              item={item}
              actions={canManageItem(item, profile) ? nextLostFoundStatuses(item.status) : []}
              busy={busyId === item.id}
              onStatus={changeStatus}
              onMatches={item.reporter.id === profile.id ? setMatchesFor : undefined}
            />
          ))}
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <ReportItemModal open={reportType !== null} defaultType={reportType ?? "lost"} onClose={() => setReportType(null)} onCreated={list.reload} />
      <MatchesModal item={matchesFor} onClose={() => setMatchesFor(null)} />
    </>
  );
}

function MatchesModal({ item, onClose }: { item: LostFoundItem | null; onClose: () => void }) {
  const { lostFound } = useServices();
  const { data, loading, error } = useAsyncData(
    async () => {
      if (!item) return [];
      const opposite: LostFoundType = item.type === "lost" ? "found" : "lost";
      const page = await lostFound.list({ query: "", type: opposite, category: item.category, status: "open" }, undefined, 30);
      return suggestMatches(item, page.items);
    },
    [lostFound, item?.id],
  );

  return (
    <Modal open={item !== null} onClose={onClose} title="Possible matches" description={item ? `Open ${item.type === "lost" ? "found" : "lost"} reports similar to “${item.title}”` : undefined}>
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner className="size-6 text-brand-700" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-slate-600">No likely matches yet. We&apos;ll keep showing new reports here, so check back soon.</p>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((match) => (
            <li key={match.id} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{match.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{match.location} · posted by {match.reporter.name}</p>
              <p className="mt-1 text-sm text-slate-600">{match.description}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
