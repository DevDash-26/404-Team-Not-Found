"use client";

import { UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextArea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, ErrorState, InlineError, LoadingCards } from "@/components/ui/States";
import { SocietyCard } from "@/features/societies/components/SocietyCard";
import { filterSocieties } from "@/features/societies/logic";
import { societyInterestSchema } from "@/features/societies/schema";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useForm } from "@/hooks/useForm";
import { useNow } from "@/hooks/useNow";
import { SOCIETY_CATEGORIES, type Society, type SocietyCategory } from "@/types";
import { toUserMessage } from "@/utils/errors";
import { humanize } from "@/utils/text";

export default function SocietiesPage() {
  const { societies } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();
  const now = useNow();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SocietyCategory | "all">("all");
  const [joining, setJoining] = useState<Society | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = useDebouncedValue(search);

  const all = useAsyncData(() => societies.listAll(), [societies]);
  const mine = useAsyncData(() => societies.getMyInterestIds(user.uid), [societies, user.uid]);
  const visible = useMemo(() => filterSocieties(all.data ?? [], { query, category }), [all.data, query, category]);

  function refresh() {
    all.reload();
    mine.reload();
  }

  async function leave(society: Society) {
    setBusyId(society.id);
    try {
      await societies.withdrawInterest(society, { id: user.uid, name: profile.name });
      toast.info(`You've withdrawn your request to join ${society.name}.`);
      refresh();
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Societies" description="Discover clubs and societies at UCL, see what they're up to and ask to join." />

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <SearchInput value={search} onChange={setSearch} placeholder="Search societies" label="Search societies" />
        <SelectInput
          label="Category"
          fieldClassName="[&>label]:sr-only"
          value={category}
          onChange={(e) => setCategory(e.target.value as SocietyCategory | "all")}
          options={[{ value: "all", label: "All categories" }, ...SOCIETY_CATEGORIES.map((c) => ({ value: c, label: humanize(c) }))]}
        />
      </div>

      {all.error ? (
        <ErrorState message={all.error} onRetry={all.reload} />
      ) : all.loading ? (
        <LoadingCards />
      ) : visible.length === 0 ? (
        <EmptyState icon={<UsersRound className="size-6" aria-hidden="true" />} title="No societies found" description="Try a different search or category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((society) => (
            <SocietyCard key={society.id} society={society} joined={mine.data?.has(society.id) ?? false} now={now} busy={busyId === society.id} onJoin={setJoining} onLeave={leave} />
          ))}
        </div>
      )}

      <Modal open={joining !== null} onClose={() => setJoining(null)} title={joining ? `Join ${joining.name}` : "Join"} description="The committee will see your name and message." size="sm">
        {joining && (
          <JoinForm
            society={joining}
            onDone={() => {
              setJoining(null);
              refresh();
            }}
          />
        )}
      </Modal>
    </>
  );
}

function JoinForm({ society, onDone }: { society: Society; onDone: () => void }) {
  const { societies } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();
  const form = useForm({
    initial: { message: "" },
    schema: societyInterestSchema,
    onSubmit: async ({ message }) => {
      await societies.expressInterest(society, { id: user.uid, name: profile.name }, message);
      toast.success(`Request sent to ${society.name}.`);
      onDone();
    },
  });
  return (
    <form onSubmit={form.submit} noValidate className="space-y-4">
      <InlineError message={form.formError} />
      <TextArea label="Message to the committee (optional)" rows={3} maxLength={500} placeholder="Tell them a little about yourself" {...form.bind("message")} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone} disabled={form.submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={form.submitting}>
          Send request
        </Button>
      </div>
    </form>
  );
}
