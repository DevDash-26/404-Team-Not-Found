"use client";

import { useState } from "react";
import { FacilityPriorityBadge, FacilityStatusBadge } from "@/components/common/StatusBadges";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { SelectInput, TextArea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { useActor } from "@/hooks/useActor";
import { emitNotificationsChanged } from "@/lib/appEvents";
import type { FacilityIssue, FacilityStatus } from "@/types";
import { formatDateTime } from "@/utils/dates";
import { toUserMessage } from "@/utils/errors";
import { humanize } from "@/utils/text";
import { nextFacilityStatuses } from "../logic";
import { IssueTimeline } from "./IssueTimeline";

interface WorkflowProps {
  issue: FacilityIssue;
  onChanged: () => void;
  onClose: () => void;
}

function Workflow({ issue, onChanged, onClose }: WorkflowProps) {
  const { facilities } = useServices();
  const toast = useToast();
  const staff = useActor();
  const options = nextFacilityStatuses(issue.status);
  const [next, setNext] = useState<FacilityStatus | "">(options[0] ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || next === "") return;
    setBusy(true);
    try {
      await facilities.advance(issue, next, note, staff);
      toast.success(`Marked as ${humanize(next).toLowerCase()}. The student has been notified.`);
      emitNotificationsChanged();
      onChanged();
      onClose();
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <FacilityStatusBadge status={issue.status} />
          <FacilityPriorityBadge priority={issue.priority} />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-900">{humanize(issue.category)} · {issue.location}</p>
        <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{issue.description}</p>
        <p className="mt-2 text-xs text-slate-500">
          Reported by {issue.reporter.name} on {formatDateTime(issue.createdAt)}
          {issue.assignedTo && ` · handled by ${issue.assignedTo.name}`}
        </p>
        {issue.imageUrl && <SmartImage src={issue.imageUrl} alt={`Photo of the ${humanize(issue.category).toLowerCase()} problem`} className="mt-3 max-h-56 w-full rounded-lg border border-slate-200" />}
      </div>

      <section aria-labelledby="history-heading">
        <h3 id="history-heading" className="mb-3 text-sm font-semibold text-slate-900">History</h3>
        <IssueTimeline updates={issue.updates} />
      </section>

      {options.length > 0 ? (
        <form onSubmit={submit} className="space-y-3 border-t border-slate-100 pt-4">
          <SelectInput
            label="Move to"
            value={next}
            onChange={(e) => setNext(e.target.value as FacilityStatus)}
            options={options.map((status) => ({ value: status, label: humanize(status) }))}
          />
          <TextArea label="Note for the student" hint="Optional. They will see this in their notification." rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Close
            </Button>
            <Button type="submit" loading={busy}>
              Update status
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

/** Shows an issue's details and history, and lets staff move it to its next status. */
export function IssueWorkflowModal({ issue, onChanged, onClose }: { issue: FacilityIssue | null; onChanged: () => void; onClose: () => void }) {
  return (
    <Modal open={issue !== null} onClose={onClose} title="Facility issue" size="md">
      {issue && <Workflow issue={issue} onChanged={onChanged} onClose={onClose} />}
    </Modal>
  );
}
