"use client";

import { CalendarX } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { EmptyState, ErrorState, LoadingCards } from "@/components/ui/States";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { SelectInput } from "@/components/ui/Field";
import { PAGINATION } from "@/config/app";
import { EventCard } from "@/features/events/components/EventCard";
import { DEFAULT_EVENT_FILTERS, filterEvents, groupEventsByDay, type EventFilters, type EventWhen } from "@/features/events/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useNow } from "@/hooks/useNow";
import { usePagedList } from "@/hooks/usePagedList";
import { emitNotificationsChanged } from "@/lib/appEvents";
import { fetchFilteredPage } from "@/services/paging";
import { EVENT_CATEGORIES, type CampusEvent, type EventCategory } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

type Tab = "upcoming" | "mine" | "past";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "mine", label: "My events" },
  { value: "past", label: "Past highlights" },
] as const;

const WHEN = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
] as const;

export default function EventsPage() {
  const { events } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();
  const now = useNow();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [when, setWhen] = useState<EventWhen>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = useDebouncedValue(search);

  const interests = useAsyncData(() => events.getInterestedEventIds(user.uid), [events, user.uid]);
  const interestedIds = useMemo(() => interests.data ?? new Set<string>(), [interests.data]);
  const [localInterest, setLocalInterest] = useState<Record<string, boolean>>({});
  const isInterested = (id: string) => localInterest[id] ?? interestedIds.has(id);

  const filters: EventFilters = useMemo(() => ({ ...DEFAULT_EVENT_FILTERS, query, category, when: tab === "past" ? "all" : when }), [query, category, when, tab]);

  const list = usePagedList<CampusEvent>(
    (cursor) =>
      fetchFilteredPage({
        fetchPage: (after) => (tab === "past" ? events.listPast(after) : events.listUpcoming(after)),
        predicate: (event) =>
          filterEvents([event], filters, now).length > 0 && (tab !== "mine" || interestedIds.has(event.id) || localInterest[event.id] === true),
        target: PAGINATION.pageSize,
        cursor,
      }),
    // `now` and interest state are read at fetch time; refetch only when the user changes what they are looking at.
    [events, tab, filters, tab === "mine" ? interests.data : null],
  );

  const toggle = useCallback(
    async (event: CampusEvent, currentlyInterested: boolean) => {
      setBusyId(event.id);
      const actor = { id: user.uid, name: profile.name };
      try {
        if (currentlyInterested) await events.cancelInterest(event, actor);
        else await events.registerInterest(event, actor);
        setLocalInterest((state) => ({ ...state, [event.id]: !currentlyInterested }));
        list.mutate((items) =>
          items.map((item) => (item.id === event.id ? { ...item, interestCount: Math.max(0, item.interestCount + (currentlyInterested ? -1 : 1)) } : item)),
        );
        toast.success(currentlyInterested ? "Removed from your events." : "Saved. We'll remind you before it starts.");
        emitNotificationsChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update your interest.");
      } finally {
        setBusyId(null);
      }
    },
    [events, user.uid, profile.name, list, toast],
  );

  const grouped = tab === "past" ? null : groupEventsByDay(list.items);

  return (
    <>
      <PageHeader title="Events" description="Find workshops, talks, competitions and social events, and register your interest." />

      <div className="mb-4 flex flex-col gap-3">
        <FilterChips label="Show" options={TABS} value={tab} onChange={setTab} />
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <SearchInput value={search} onChange={setSearch} placeholder="Search events, places, organisers" label="Search events" />
          <SelectInput
            label="Category"
            fieldClassName="[&>label]:sr-only"
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory | "all")}
            options={[{ value: "all", label: "All categories" }, ...EVENT_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]}
          />
        </div>
        {tab !== "past" && <FilterChips label="When" options={WHEN} value={when} onChange={setWhen} />}
      </div>

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingCards />
      ) : list.items.length === 0 ? (
        <EmptyState
          icon={<CalendarX className="size-6" aria-hidden="true" />}
          title={tab === "mine" ? "You haven't saved any events yet" : "No events match"}
          description={tab === "mine" ? "Tap “I'm interested” on an event to keep it here and get a reminder." : "Try a different search, category or time range."}
        />
      ) : grouped ? (
        <div className="space-y-8">
          {grouped.map(([day, dayEvents]) => (
            <section key={day} aria-label={formatDate(dayEvents[0]?.startsAt)}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{formatDate(dayEvents[0]?.startsAt)}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} interested={isInterested(event.id)} now={now} busy={busyId === event.id} onToggleInterest={toggle} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.items.map((event) => (
            <EventCard key={event.id} event={event} interested={isInterested(event.id)} now={now} busy={false} onToggleInterest={toggle} />
          ))}
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
    </>
  );
}
