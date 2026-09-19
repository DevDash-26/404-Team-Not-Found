"use client";

import { useCallback, useState } from "react";
import { LoadMore } from "@/components/common/LoadMore";
import { BookingStatusBadge } from "@/components/common/StatusBadges";
import { DataTable } from "@/components/admin/DataTable";
import { NoteDialog } from "@/components/admin/NoteDialog";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { FilterChips } from "@/components/ui/FilterChips";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useActor } from "@/hooks/useActor";
import { usePagedList } from "@/hooks/usePagedList";
import { emitNotificationsChanged } from "@/lib/appEvents";
import { fetchFilteredPage } from "@/services/paging";
import type { Booking, BookingStatus } from "@/types";
import { formatDate, parseDateKey } from "@/utils/dates";
import { canTransitionBooking } from "../logic";

type Filter = BookingStatus | "all";
type Action = { kind: "approve" | "reject" | "cancel"; booking: Booking };

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "pending", label: "Needs a decision" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const COPY = {
  approve: { title: "Approve this booking?", confirm: "Approve", note: "Note for the student (optional)", required: false, tone: "primary" as const, done: "Booking approved. The student has been notified." },
  reject: { title: "Reject this booking?", confirm: "Reject", note: "Reason for the student", required: true, tone: "danger" as const, done: "Booking rejected and the room is free again." },
  cancel: { title: "Cancel this booking?", confirm: "Cancel booking", note: "Reason for the student", required: true, tone: "danger" as const, done: "Booking cancelled and the room is free again." },
};

/** Staff view of every classroom booking request, with approve, reject and cancel decisions. */
export function BookingQueue() {
  const { classrooms } = useServices();
  const toast = useToast();
  const staff = useActor();
  const [filter, setFilter] = useState<Filter>("pending");
  const [action, setAction] = useState<Action | null>(null);

  const load = useCallback(
    (cursor: unknown | undefined) =>
      fetchFilteredPage({
        fetchPage: (next) => classrooms.listAll(next),
        predicate: (booking) => filter === "all" || booking.status === filter,
        target: 10,
        cursor,
      }),
    [classrooms, filter],
  );
  const list = usePagedList<Booking>(load, [load]);

  async function confirm(note: string) {
    if (!action) return;
    const { kind, booking } = action;
    if (kind === "cancel") await classrooms.cancel(booking, staff, "staff", note);
    else await classrooms.decide(booking, kind === "approve" ? "approved" : "rejected", staff, note);
    toast.success(COPY[kind].done);
    emitNotificationsChanged();
    list.reload();
  }

  return (
    <>
      <FilterChips<Filter> label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} className="mb-4" />
      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : list.loading ? (
        <LoadingRows />
      ) : list.items.length === 0 ? (
        <EmptyState title={filter === "pending" ? "No requests waiting" : "No bookings here"} description={filter === "pending" ? "New classroom requests will appear here for you to approve or reject." : "Try a different filter."} />
      ) : (
        <DataTable
          caption="Classroom bookings"
          rows={list.items}
          columns={[
            {
              header: "Room",
              render: (b) => (
                <div className="min-w-40">
                  <p className="font-medium text-slate-900">{b.roomName}</p>
                  <p className="text-xs text-slate-500">{b.attendees} attending</p>
                </div>
              ),
            },
            {
              header: "When",
              render: (b) => {
                const date = parseDateKey(b.date);
                return (
                  <div className="whitespace-nowrap">
                    <p className="text-slate-800">{date ? formatDate(date) : b.date}</p>
                    <p className="text-xs text-slate-500">{b.startTime} – {b.endTime}</p>
                  </div>
                );
              },
            },
            {
              header: "Request",
              render: (b) => (
                <div className="min-w-48 max-w-sm">
                  <p className="text-slate-800">{b.purpose}</p>
                  <p className="text-xs text-slate-500">by {b.requester.name}</p>
                  {b.decisionNote && <p className="mt-1 text-xs italic text-slate-500">“{b.decisionNote}”</p>}
                </div>
              ),
            },
            { header: "Status", render: (b) => <BookingStatusBadge status={b.status} /> },
          ]}
          actions={(booking) => (
            <div className="flex justify-end gap-1">
              {canTransitionBooking(booking.status, "approved", "staff") && (
                <Button size="sm" onClick={() => setAction({ kind: "approve", booking })}>
                  Approve
                </Button>
              )}
              {canTransitionBooking(booking.status, "rejected", "staff") && (
                <Button size="sm" variant="secondary" onClick={() => setAction({ kind: "reject", booking })}>
                  Reject
                </Button>
              )}
              {canTransitionBooking(booking.status, "cancelled", "staff") && (
                <Button size="sm" variant="ghost" className="text-red-700 hover:bg-red-50" onClick={() => setAction({ kind: "cancel", booking })}>
                  Cancel
                </Button>
              )}
            </div>
          )}
        />
      )}
      <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onClick={list.loadMore} />

      <NoteDialog
        open={action !== null}
        title={action ? COPY[action.kind].title : ""}
        description={action ? `${action.booking.roomName} · ${action.booking.date} ${action.booking.startTime}–${action.booking.endTime}` : undefined}
        noteLabel={action ? COPY[action.kind].note : ""}
        required={action ? COPY[action.kind].required : false}
        confirmLabel={action ? COPY[action.kind].confirm : "Confirm"}
        tone={action ? COPY[action.kind].tone : "primary"}
        onConfirm={confirm}
        onClose={() => setAction(null)}
      />
    </>
  );
}
