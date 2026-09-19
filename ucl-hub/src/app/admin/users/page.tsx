"use client";

import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { RequireCapability } from "@/components/layout/RequireCapability";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DynamicForm } from "@/components/admin/DynamicForm";
import { toOptions } from "@/components/admin/options";
import { ResourceManager } from "@/components/admin/ResourceManager";
import type { FieldDef } from "@/components/admin/fields";
import { accessUpdateSchema, newUserSchema, type NewUserInput } from "@/features/users/schema";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { AccessUpdate } from "@/lib/backend/types";
import { ROLES, STAFF_ROLES, STAFF_ROLE_LABELS, type Role, type UserProfile } from "@/types";
import { formatDate } from "@/utils/dates";
import { humanize } from "@/utils/text";

const ROLE_TONE: Record<Role, BadgeTone> = { admin: "danger", staff: "brand", student: "neutral" };
const ROLE_OPTIONS = toOptions(ROLES, { admin: "Administrator" });
const STAFF_OPTIONS = toOptions(STAFF_ROLES, STAFF_ROLE_LABELS);

export default function AdminUsersPage() {
  const { users, societies } = useServices();
  const { user: me } = useCurrentUser();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [version, setVersion] = useState(0);
  const societyList = useAsyncData(() => societies.listAll(), [societies]);

  const accessFields = useMemo<FieldDef[]>(() => {
    const societyOptions = (societyList.data ?? []).map((s) => ({ value: s.id, label: s.name }));
    return [
      { name: "role", label: "Role", type: "select", required: true, options: ROLE_OPTIONS, hint: "Administrators can manage everything. Staff manage the areas of their group." },
      { name: "staffRole", label: "Staff group", type: "select", nullable: true, placeholder: "Not a staff member", options: STAFF_OPTIONS, span: 1, hint: "Required for staff." },
      { name: "societyId", label: "Society", type: "select", nullable: true, placeholder: "None", options: societyOptions, span: 1, hint: "Only for society representatives." },
    ];
  }, [societyList.data]);

  const createFields = useMemo<FieldDef[]>(
    () => [
      { name: "name", label: "Full name", type: "text", required: true, span: 1 },
      { name: "email", label: "Email", type: "email", required: true, span: 1 },
      { name: "password", label: "Temporary password", type: "password", required: true, span: 1, hint: "At least 8 characters. They can change it later." },
      { name: "department", label: "Department", type: "text", span: 1 },
      ...accessFields,
    ],
    [accessFields],
  );

  return (
    <RequireCapability capability="users">
      <ResourceManager<UserProfile, AccessUpdate>
        title="Users"
        description="Everyone with an account. Change a person's role or create a staff account. Role changes are applied by the server and take effect the next time they sign in."
        singular="user"
        fields={accessFields}
        schema={accessUpdateSchema}
        modalSize="md"
        loadPage={(cursor) => users.listAll(cursor)}
        loadDeps={[users, version]}
        update={(item, input) => users.updateAccess(item.id, input)}
        canEdit={(item) => item.id !== me.uid}
        searchText={(u) => [u.name, u.email, u.role, u.staffRole ?? "", u.programme ?? "", u.studentId ?? ""]}
        headerActions={
          <Button icon={<UserPlus className="size-4" aria-hidden="true" />} onClick={() => setCreating(true)}>
            Create account
          </Button>
        }
        columns={[
          {
            header: "Person",
            render: (u) => (
              <div className="min-w-48">
                <p className="font-medium text-slate-900">{u.name}{u.id === me.uid && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
            ),
          },
          {
            header: "Role",
            render: (u) => (
              <div className="space-y-1">
                <Badge tone={ROLE_TONE[u.role]}>{u.role === "admin" ? "Administrator" : humanize(u.role)}</Badge>
                {u.staffRole && <p className="text-xs text-slate-600">{STAFF_ROLE_LABELS[u.staffRole]}</p>}
              </div>
            ),
          },
          { header: "Programme", render: (u) => <span className="text-slate-600">{u.programme ? `${u.programme}${u.year ? ` · Year ${u.year}` : ""}` : u.department ?? "—"}</span> },
          { header: "Joined", render: (u) => <span className="whitespace-nowrap text-slate-600">{formatDate(u.createdAt)}</span> },
        ]}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="Create account" description="The person can sign in straight away with this email and password." size="lg">
        {creating && (
          <DynamicForm<NewUserInput>
            fields={createFields}
            schema={newUserSchema}
            defaults={{ role: "staff" }}
            submitLabel="Create account"
            onCancel={() => setCreating(false)}
            onSubmit={async (input) => {
              await users.createAccount(input);
              toast.success(`Account created for ${input.name}.`);
              setCreating(false);
              setVersion((v) => v + 1);
            }}
          />
        )}
      </Modal>
    </RequireCapability>
  );
}
