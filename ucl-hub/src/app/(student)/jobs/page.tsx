"use client";

import { Briefcase } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { useServices } from "@/components/providers/ServicesProvider";
import { Checkbox, SelectInput, TextInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingCards } from "@/components/ui/States";
import { PAGINATION } from "@/config/app";
import { JobCard } from "@/features/jobs/components/JobCard";
import { allSkills, filterJobs, sortJobs, type JobFilters } from "@/features/jobs/logic";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useNow } from "@/hooks/useNow";
import { usePagedList } from "@/hooks/usePagedList";
import { JOB_TYPES, type JobType } from "@/types";
import { humanize } from "@/utils/text";

export default function JobsPage() {
  const { jobs } = useServices();
  const now = useNow();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<JobType | "all">("all");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [openOnly, setOpenOnly] = useState(true);
  const query = useDebouncedValue(search);
  const debouncedLocation = useDebouncedValue(location);

  const list = usePagedList((cursor) => jobs.list(cursor, PAGINATION.pageSize * 2), [jobs]);
  const filters: JobFilters = { query, type, location: debouncedLocation, skill, openOnly };
  const visible = useMemo(() => sortJobs(filterJobs(list.items, filters, now), now), [list.items, query, type, debouncedLocation, skill, openOnly, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const skills = useMemo(() => allSkills(list.items), [list.items]);

  return (
    <>
      <PageHeader title="Jobs & internships" description="Openings shared by UCL's careers team and partner companies. Filter by type, place or skill." />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_11rem_12rem_12rem]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search roles or companies" label="Search jobs" />
        <SelectInput
          label="Type"
          fieldClassName="[&>label]:sr-only"
          value={type}
          onChange={(e) => setType(e.target.value as JobType | "all")}
          options={[{ value: "all", label: "All types" }, ...JOB_TYPES.map((t) => ({ value: t, label: humanize(t) }))]}
        />
        <TextInput label="Location" fieldClassName="[&>label]:sr-only" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <SelectInput label="Skill" fieldClassName="[&>label]:sr-only" value={skill} onChange={(e) => setSkill(e.target.value)} options={[{ value: "", label: "Any skill" }, ...skills.map((s) => ({ value: s, label: s }))]} />
      </div>
      <Checkbox className="mb-5" label="Hide closed listings" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingCards />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Briefcase className="size-6" aria-hidden="true" />} title="No openings match" description="Try removing a filter, or check back soon: new roles are added every week." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((job) => (
            <JobCard key={job.id} job={job} now={now} />
          ))}
        </div>
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />
    </>
  );
}
