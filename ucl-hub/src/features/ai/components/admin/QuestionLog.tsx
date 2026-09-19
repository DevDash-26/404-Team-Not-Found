"use client";

import { useState } from "react";
import { z } from "zod";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { FilterChips } from "@/components/ui/FilterChips";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { fetchFilteredPage } from "@/services/paging";
import type { AssistantLog } from "@/types";
import { formatDateTime } from "@/utils/dates";

type Filter = "unanswered" | "all";
const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "unanswered", label: "Couldn't answer" },
  { value: "all", label: "All questions" },
];
const noForm = z.object({});

/** Anonymous record of what students asked. Unanswered questions show where knowledge is missing. */
export function QuestionLog() {
  const { knowledge } = useServices();
  const [filter, setFilter] = useState<Filter>("unanswered");

  return (
    <ResourceManager<AssistantLog, z.infer<typeof noForm>>
      title="Student questions"
      description="What students asked the assistant (no names are stored). Questions it couldn't answer are the best candidates for new knowledge entries."
      singular="question"
      fields={[]}
      schema={noForm}
      loadPage={(cursor) =>
        fetchFilteredPage({
          fetchPage: (next) => knowledge.listLogs(next),
          predicate: (log) => filter === "all" || !log.answered,
          target: 10,
          cursor,
        })
      }
      loadDeps={[knowledge, filter]}
      searchText={(l) => [l.question]}
      toolbar={<FilterChips<Filter> label="Filter questions" options={FILTERS} value={filter} onChange={setFilter} />}
      columns={[
        { header: "Question", render: (l) => <span className="block min-w-56 max-w-lg text-slate-800">{l.question}</span> },
        { header: "Result", render: (l) => (l.answered ? <Badge tone="success">Answered</Badge> : <Badge tone="warning">No answer</Badge>) },
        { header: "Sources", render: (l) => <span className="tabular-nums text-slate-600">{l.sourceCount}</span> },
        { header: "Engine", render: (l) => <span className="text-slate-600">{l.provider}</span> },
        { header: "Asked", render: (l) => <span className="whitespace-nowrap text-slate-600">{formatDateTime(l.createdAt)}</span> },
      ]}
    />
  );
}
