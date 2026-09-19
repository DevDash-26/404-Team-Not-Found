"use client";

import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import type { KnowledgeEntry } from "@/types";
import { formatDate } from "@/utils/dates";
import { truncate } from "@/utils/text";
import { knowledgeSchema, type KnowledgeInput } from "../../knowledge/schema";

const FIELDS: FieldDef[] = [
  { name: "title", label: "Topic", type: "text", required: true, maxLength: 140, placeholder: "e.g. Library exam-week opening hours" },
  { name: "content", label: "What the assistant should know", type: "textarea", required: true, rows: 6, maxLength: 4000, hint: "Write it as plain facts. The assistant answers from this text, so include times, places and contacts." },
  { name: "keywords", label: "Keywords", type: "tags", hint: "Words students might use when asking, separated by commas." },
  { name: "link", label: "Link", type: "text", placeholder: "/library or https://…", hint: "Optional page the assistant offers as a button." },
  { name: "active", label: "Status", type: "checkbox", description: "The assistant may use this entry" },
];

/** Administrators teach the assistant extra facts (schedule changes, policies) without touching code. */
export function KnowledgeManager() {
  const { knowledge } = useServices();
  return (
    <ResourceManager<KnowledgeEntry, KnowledgeInput>
      title="Assistant knowledge"
      description="Extra facts the AI assistant can use, on top of announcements, events, FAQs, services and the rest of the platform."
      singular="entry"
      fields={FIELDS}
      schema={knowledgeSchema}
      defaults={{ active: true }}
      loadPage={(cursor) => knowledge.listEntries(cursor)}
      loadDeps={[knowledge]}
      create={(input) => knowledge.create(input)}
      update={(item, input) => knowledge.update(item.id, input)}
      remove={(item) => knowledge.remove(item.id)}
      searchText={(k) => [k.title, k.content, ...k.keywords]}
      deleteMessage={(k) => `The assistant will stop using “${k.title}”.`}
      modalSize="md"
      columns={[
        {
          header: "Topic",
          render: (k) => (
            <div className="min-w-56 max-w-lg">
              <p className="font-medium text-slate-900">{k.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{truncate(k.content, 120)}</p>
            </div>
          ),
        },
        { header: "Keywords", render: (k) => <span className="text-slate-600">{k.keywords.slice(0, 4).join(", ") || "—"}</span> },
        { header: "Status", render: (k) => (k.active ? <Badge tone="success">Active</Badge> : <Badge>Paused</Badge>) },
        { header: "Updated", render: (k) => <span className="whitespace-nowrap text-slate-600">{formatDate(k.updatedAt)}</span> },
      ]}
    />
  );
}
