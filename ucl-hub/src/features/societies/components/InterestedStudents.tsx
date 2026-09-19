"use client";

import { useServices } from "@/components/providers/ServicesProvider";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useAsyncData } from "@/hooks/useAsyncData";
import type { Society } from "@/types";
import { formatDate } from "@/utils/dates";

function InterestList({ society }: { society: Society }) {
  const { societies } = useServices();
  const list = useAsyncData(() => societies.listInterests(society.id), [societies, society.id]);

  if (list.error) return <ErrorState message={list.error} onRetry={list.reload} />;
  if (list.loading || !list.data) return <LoadingRows count={3} />;
  if (list.data.items.length === 0) {
    return <EmptyState title="No requests yet" description="When students ask to join, they will appear here with their message." />;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {list.data.items.map((interest) => (
        <li key={interest.id} className="py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium text-slate-900">{interest.userName}</p>
            <p className="text-xs text-slate-500">{formatDate(interest.createdAt)}</p>
          </div>
          <p className="mt-1 text-sm text-slate-600">{interest.message || "No message left."}</p>
        </li>
      ))}
    </ul>
  );
}

/** Lets a society's committee see who asked to join. */
export function InterestedStudentsModal({ society, onClose }: { society: Society | null; onClose: () => void }) {
  return (
    <Modal open={society !== null} onClose={onClose} title={society ? `Interested in ${society.name}` : "Interested students"} description="Students who asked to join this society.">
      {society && <InterestList society={society} />}
    </Modal>
  );
}
