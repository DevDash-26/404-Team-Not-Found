"use client";

import { Mail, MapPin, Phone, UserRoundSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { MetaLine } from "@/components/common/MetaLine";
import { useServices } from "@/components/providers/ServicesProvider";
import { Card } from "@/components/ui/Card";
import { SelectInput } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingCards } from "@/components/ui/States";
import { departments, filterStaff } from "@/features/services/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { initials } from "@/utils/text";

export default function StaffDirectoryPage() {
  const { directory } = useServices();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const query = useDebouncedValue(search);
  const { data, loading, error, reload } = useAsyncData(() => directory.listStaff(), [directory]);
  const visible = useMemo(() => filterStaff(data ?? [], query, department), [data, query, department]);
  const depts = useMemo(() => departments(data ?? []), [data]);

  return (
    <>
      <PageHeader title="Staff directory" description="Find the right person: search by name, department or what you need help with." />
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <SearchInput value={search} onChange={setSearch} placeholder="Try “scholarship”, “timetable” or a name" label="Search staff" />
        <SelectInput label="Department" fieldClassName="[&>label]:sr-only" value={department} onChange={(e) => setDepartment(e.target.value)} options={[{ value: "all", label: "All departments" }, ...depts.map((d) => ({ value: d, label: d }))]} />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingCards />
      ) : visible.length === 0 ? (
        <EmptyState icon={<UserRoundSearch className="size-6" aria-hidden="true" />} title="No one matches" description="Try a broader search, or ask the AI assistant who to contact." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((person) => (
            <Card key={person.id} className="p-4">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800">
                  {initials(person.name)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{person.name}</h3>
                  <p className="text-sm text-slate-600">{person.title}</p>
                  <p className="text-xs text-slate-500">{person.department}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {person.office && <MetaLine icon={MapPin}>{person.office}</MetaLine>}
                {person.email && (
                  <MetaLine icon={Mail}>
                    <a className="text-brand-700 hover:underline" href={`mailto:${person.email}`}>
                      {person.email}
                    </a>
                  </MetaLine>
                )}
                {person.phone && (
                  <MetaLine icon={Phone}>
                    <a className="text-brand-700 hover:underline" href={`tel:${person.phone.replace(/\s/g, "")}`}>
                      {person.phone}
                    </a>
                  </MetaLine>
                )}
              </div>
              {person.topics.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Can help with:</span> {person.topics.join(", ")}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
