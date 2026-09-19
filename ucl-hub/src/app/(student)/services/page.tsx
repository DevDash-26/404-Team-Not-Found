"use client";

import { Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useServices } from "@/components/providers/ServicesProvider";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, LoadingCards } from "@/components/ui/States";
import { ServiceCard } from "@/features/services/components/ServiceCard";
import { filterServices } from "@/features/services/logic";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/types";
import { humanize } from "@/utils/text";

export default function ServicesPage() {
  const { directory } = useServices();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const query = useDebouncedValue(search);
  const { data, loading, error, reload } = useAsyncData(() => directory.listServices(), [directory]);
  const visible = useMemo(() => filterServices(data ?? [], query, category), [data, query, category]);

  return (
    <>
      <PageHeader title="Campus services" description="Where to go, when it's open and how to get in touch." />
      <div className="mb-5 space-y-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search services, places or opening days" label="Search services" className="sm:max-w-md" />
        <FilterChips
          label="Service category"
          value={category}
          onChange={setCategory}
          options={[{ value: "all", label: "All" }, ...SERVICE_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]}
        />
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <LoadingCards />
      ) : visible.length === 0 ? (
        <EmptyState icon={<Building2 className="size-6" aria-hidden="true" />} title="No services match" description="Try another word or category." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((service) => <ServiceCard key={service.id} service={service} />)}</div>
      )}
    </>
  );
}
