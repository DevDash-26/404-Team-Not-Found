"use client";

import { Megaphone } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectInput } from "@/components/ui/Field";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { filterAnnouncements, sortByImportance, type AnnouncementFilters } from "@/features/announcements/logic";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagedList } from "@/hooks/usePagedList";
import { ANNOUNCEMENT_CATEGORIES, type AnnouncementCategory, type AnnouncementPriority } from "@/types";
import { humanize } from "@/utils/text";

const PRIORITIES = [
  { value: "all", label: "All" },
  { value: "emergency", label: "Emergency" },
  { value: "important", label: "Important" },
  { value: "normal", label: "General" },
] as const;

export default function AnnouncementsPage() {
  const { announcements } = useServices();
  const { profile } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory | "all">("all");
  const [priority, setPriority] = useState<AnnouncementPriority | "all">("all");
  const query = useDebouncedValue(search);

  const list = usePagedList((cursor) => announcements.listForProfile(profile, cursor), [announcements, profile.id, profile.faculty, profile.programme, profile.year]);

  const filters: AnnouncementFilters = { query, category, priority };
  const visible = useMemo(() => sortByImportance(filterAnnouncements(list.items, filters)), [list.items, query, category, priority]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageHeader title="Announcements" description="Official news from UCL offices, shown for your faculty, programme and year." />

      <div className="mb-5 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search announcements" label="Search announcements" />
          <SelectInput
            label="Category"
            fieldClassName="[&>label]:sr-only"
            value={category}
            onChange={(e) => setCategory(e.target.value as AnnouncementCategory | "all")}
            options={[{ value: "all", label: "All categories" }, ...ANNOUNCEMENT_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]}
          />
        </div>
        <FilterChips label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingRows count={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-6" aria-hidden="true" />}
          title="No announcements found"
          description={query || category !== "all" || priority !== "all" ? "Try clearing your search or filters." : "You're all caught up. New announcements will appear here."}
        />
      ) : (
        <div className="space-y-4">
          {visible.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
    </>
  );
}
