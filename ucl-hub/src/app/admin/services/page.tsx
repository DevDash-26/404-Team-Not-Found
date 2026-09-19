"use client";

import { useState } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { toOptions } from "@/components/admin/options";
import { ResourceManager, singlePage } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { summariseHours } from "@/features/services/logic";
import { serviceSchema, staffContactSchema, type ServiceInput, type StaffContactInput } from "@/features/services/schema";
import { SERVICE_CATEGORIES, type CampusService, type StaffContact } from "@/types";
import { humanize } from "@/utils/text";

const SERVICE_FIELDS: FieldDef[] = [
  { name: "name", label: "Service name", type: "text", required: true, span: 1 },
  { name: "category", label: "Category", type: "select", required: true, span: 1, options: toOptions(SERVICE_CATEGORIES, { it: "IT", "student-affairs": "Student affairs" }) },
  { name: "description", label: "What it offers", type: "textarea", required: true, rows: 4, maxLength: 4000 },
  { name: "location", label: "Location", type: "text", required: true },
  {
    name: "openingHours",
    label: "Opening hours",
    type: "list",
    addLabel: "Add hours",
    itemLabel: "Hours",
    max: 10,
    itemFields: [
      { name: "days", label: "Days", type: "text", span: 1, placeholder: "Mon–Fri" },
      { name: "hours", label: "Hours", type: "text", span: 1, placeholder: "8:30 am – 5:00 pm" },
    ],
  },
  { name: "email", label: "Email", type: "email", span: 1 },
  { name: "phone", label: "Phone", type: "tel", span: 1 },
  {
    name: "links",
    label: "Useful links",
    type: "list",
    addLabel: "Add link",
    itemLabel: "Link",
    max: 8,
    itemFields: [
      { name: "label", label: "Label", type: "text", span: 1 },
      { name: "url", label: "Address", type: "url", span: 1, placeholder: "https://" },
    ],
  },
];

const STAFF_FIELDS: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, span: 1 },
  { name: "title", label: "Job title", type: "text", required: true, span: 1 },
  { name: "department", label: "Department", type: "text", required: true, span: 1 },
  { name: "office", label: "Office", type: "text", span: 1 },
  { name: "email", label: "Email", type: "email", span: 1 },
  { name: "phone", label: "Phone", type: "tel", span: 1 },
  { name: "topics", label: "Contact about", type: "tags", hint: "Topics students would contact this person about. Search and the AI assistant use these." },
];

type Tab = "services" | "staff";

export default function AdminServicesPage() {
  const { directory } = useServices();
  const { can } = useAuth();
  const [tab, setTab] = useState<Tab>("services");
  const canStaff = can("staffDirectory");
  const active: Tab = canStaff ? tab : "services";

  return (
    <RequireCapability capability="services">
      {canStaff && (
        <Tabs<Tab>
          label="Directory sections"
          value={active}
          onChange={setTab}
          tabs={[
            { value: "services", label: "Campus services" },
            { value: "staff", label: "Staff directory" },
          ]}
        />
      )}
      {active === "services" ? (
        <ResourceManager<CampusService, ServiceInput>
          key="services"
          title="Campus services"
          description="Opening hours, locations and contacts for the offices students rely on."
          singular="service"
          fields={SERVICE_FIELDS}
          schema={serviceSchema}
          defaults={{ category: "student-affairs" }}
          loadPage={singlePage(() => directory.listServices())}
          loadDeps={[directory]}
          create={(input) => directory.createService(input)}
          update={(item, input) => directory.updateService(item.id, input)}
          remove={(item) => directory.removeService(item.id)}
          searchText={(s) => [s.name, s.category, s.location, s.description]}
          columns={[
            {
              header: "Service",
              render: (s) => (
                <div className="min-w-48">
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.location}</p>
                </div>
              ),
            },
            { header: "Category", render: (s) => <Badge>{humanize(s.category)}</Badge> },
            { header: "Hours", render: (s) => <span className="text-slate-600">{summariseHours(s)}</span> },
            { header: "Contact", render: (s) => <span className="text-slate-600">{s.email || s.phone || "—"}</span> },
          ]}
        />
      ) : (
        <ResourceManager<StaffContact, StaffContactInput>
          key="staff"
          title="Staff directory"
          description="Who students should contact, and about what."
          singular="contact"
          fields={STAFF_FIELDS}
          schema={staffContactSchema}
          loadPage={singlePage(() => directory.listStaff())}
          loadDeps={[directory]}
          create={(input) => directory.createStaff(input)}
          update={(item, input) => directory.updateStaff(item.id, input)}
          remove={(item) => directory.removeStaff(item.id)}
          searchText={(s) => [s.name, s.title, s.department, ...s.topics]}
          columns={[
            {
              header: "Person",
              render: (s) => (
                <div className="min-w-48">
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.title}</p>
                </div>
              ),
            },
            { header: "Department", render: (s) => <span className="text-slate-600">{s.department}</span> },
            { header: "Contact", render: (s) => <span className="text-slate-600">{s.email || s.phone || "—"}</span> },
            { header: "Topics", render: (s) => <span className="text-slate-600">{s.topics.slice(0, 3).join(", ")}</span> },
          ]}
        />
      )}
    </RequireCapability>
  );
}
