"use client";

import { useState } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { toOptions } from "@/components/admin/options";
import { ResourceManager, singlePage } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { InterestedStudentsModal } from "@/features/societies/components/InterestedStudents";
import { societySchema, type SocietyInput } from "@/features/societies/schema";
import { useActor } from "@/hooks/useActor";
import { canManageSociety } from "@/lib/permissions";
import { SOCIETY_CATEGORIES, type Society } from "@/types";
import { humanize } from "@/utils/text";

const FIELDS: FieldDef[] = [
  { name: "name", label: "Society name", type: "text", required: true, span: 1 },
  { name: "category", label: "Category", type: "select", required: true, span: 1, options: toOptions(SOCIETY_CATEGORIES, { "arts-culture": "Arts & culture" }) },
  { name: "description", label: "About the society", type: "textarea", required: true, rows: 4, maxLength: 4000 },
  { name: "contactEmail", label: "Contact email", type: "email", required: true, span: 1 },
  { name: "colour", label: "Brand colour", type: "color", span: 1 },
  { name: "memberCount", label: "Members", type: "number", min: 0, span: 1 },
  { name: "logoUrl", label: "Logo", type: "image", pathName: "logoPath", folder: "content/societies" },
  {
    name: "committee",
    label: "Committee",
    type: "list",
    addLabel: "Add committee member",
    itemLabel: "Member",
    max: 12,
    itemFields: [
      { name: "role", label: "Role", type: "text", span: 1 },
      { name: "name", label: "Name", type: "text", span: 1 },
      { name: "email", label: "Email", type: "email", span: 2 },
    ],
  },
  {
    name: "activities",
    label: "Upcoming activities",
    type: "list",
    addLabel: "Add activity",
    itemLabel: "Activity",
    max: 20,
    hint: "Adding an activity notifies students.",
    itemFields: [
      { name: "title", label: "Title", type: "text", span: 2 },
      { name: "date", label: "When", type: "datetime", span: 1 },
      { name: "location", label: "Where", type: "text", span: 1 },
    ],
  },
];

export default function AdminSocietiesPage() {
  const { societies } = useServices();
  const { access } = useCurrentUser();
  const actor = useActor();
  const [viewing, setViewing] = useState<Society | null>(null);
  const isAdmin = access.role === "admin";

  return (
    <RequireCapability capability="societies">
      <ResourceManager<Society, SocietyInput>
        title="Societies"
        description={isAdmin ? "Register societies and keep their details up to date." : "Keep your society's page and activities up to date."}
        singular="society"
        fields={FIELDS}
        schema={societySchema}
        defaults={{ category: "community", colour: "#2c4e8c", memberCount: 0 }}
        loadPage={singlePage(() => societies.listAll())}
        loadDeps={[societies]}
        create={isAdmin ? (input) => societies.create(input) : undefined}
        update={(item, input) => societies.update(item.id, input, actor)}
        remove={isAdmin ? (item) => societies.remove(item.id) : undefined}
        canEdit={(society) => canManageSociety(access, society.id)}
        searchText={(s) => [s.name, s.category, s.description]}
        deleteMessage={(s) => `"${s.name}" will be removed along with its committee and activities.`}
        extraActions={[{ label: "Interested", onClick: setViewing, show: (s) => canManageSociety(access, s.id) }]}
        columns={[
          {
            header: "Society",
            render: (s) => (
              <div className="flex min-w-48 items-center gap-3">
                <span aria-hidden="true" className="size-8 shrink-0 rounded-lg" style={{ backgroundColor: s.colour }} />
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.contactEmail}</p>
                </div>
              </div>
            ),
          },
          { header: "Category", render: (s) => <Badge>{humanize(s.category)}</Badge> },
          { header: "Members", render: (s) => <span className="tabular-nums">{s.memberCount}</span> },
          { header: "Join requests", render: (s) => <span className="tabular-nums">{s.interestCount}</span> },
          { header: "Activities", render: (s) => <span className="tabular-nums">{s.activities.length}</span> },
        ]}
      />
      <InterestedStudentsModal society={viewing} onClose={() => setViewing(null)} />
    </RequireCapability>
  );
}
