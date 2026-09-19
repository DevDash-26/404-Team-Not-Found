"use client";

import { CalendarClock, DoorOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { BookingStatusBadge } from "@/components/common/StatusBadges";
import { useCurrentUser } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/States";
import { useAsyncData } from "@/hooks/useAsyncData";
import { useNow } from "@/hooks/useNow";
import { emitNotificationsChanged } from "@/lib/appEvents";
import type { Booking } from "@/types";
import { formatDate } from "@/utils/dates";
import { toUserMessage } from "@/utils/errors";
import { canTransitionBooking, isUpcoming } from "../logic";

export function MyBookings({ refreshKey }: { refreshKey: number }) {
  const { classrooms } = useServices();
  const { user, profile } = useCurrentUser();
  const toast = useToast();
  const now = useNow();
  const { data, loading, error, reload } = useAsyncData(() => classrooms.listMine(user.uid), [classrooms, user.uid, refreshKey]);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  const { upcoming, earlier } = useMemo(() => {
    const all = data ?? [];
    return {
      upcoming: all.filter((b) => (b.status === "pending" || b.status === "approved") && isUpcoming(b, now)).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
      earlier: all.filter((b) => !((b.status === "pending" || b.status === "approved") && isUpcoming(b, now))),
    };
  }, [data, now]);

  async function confirmCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      await classrooms.cancel(cancelling, { id: user.uid, name: profile.name }, "owner");
      toast.success("Booking cancelled. The time is free again.");
      emitNotificationsChanged();
      setCancelling(null);
      reload();
    } catch (e) {
      toast.error(toUserMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading) return <LoadingRows />;
  if ((data ?? []).length === 0) {
    return <EmptyState icon={<DoorOpen className="size-6" aria-hidden="true" />} title="No bookings yet" description="Choose a room on the “Find a room” tab and send a request." />;
  }

  const row = (booking: Booking) => (
    <Card key={booking.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{booking.roomName}</h3>
          <BookingStatusBadge status={booking.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
          <CalendarClock className="size-4 text-slate-400" aria-hidden="true" />
          {formatDate(booking.date)}, {booking.startTime} to {booking.endTime} · {booking.attendees} {booking.attendees === 1 ? "person" : "people"}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">{booking.purpose}</p>
        {booking.decisionNote && (
          <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
            <span className="font-medium">{booking.decidedBy?.name ?? "Staff"}:</span> {booking.decisionNote}
          </p>
        )}
      </div>
      {canTransitionBooking(booking.status, "cancelled", "owner") && isUpcoming(booking, now) && (
        <Button variant="secondary" size="sm" onClick={() => setCancelling(booking)}>
          Cancel booking
        </Button>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-bookings">
          <h2 id="upcoming-bookings" className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming</h2>
          <div className="space-y-3">{upcoming.map(row)}</div>
        </section>
      )}
      {earlier.length > 0 && (
        <section aria-labelledby="earlier-bookings">
          <h2 id="earlier-bookings" className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Earlier and closed</h2>
          <div className="space-y-3">{earlier.map(row)}</div>
        </section>
      )}
      <ConfirmDialog
        open={cancelling !== null}
        title="Cancel this booking?"
        message={cancelling ? `${cancelling.roomName} on ${formatDate(cancelling.date)}, ${cancelling.startTime} to ${cancelling.endTime}. Other students will be able to book the time.` : ""}
        confirmLabel="Yes, cancel it"
        loading={busy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}
