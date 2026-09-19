import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type {
  AnnouncementPriority,
  BookingStatus,
  FacilityPriority,
  FacilityStatus,
  LostFoundStatus,
  SupportStatus,
} from "@/types";
import { humanize } from "@/utils/text";

const BOOKING: Record<BookingStatus, BadgeTone> = { pending: "warning", approved: "success", rejected: "danger", cancelled: "neutral" };
const FACILITY: Record<FacilityStatus, BadgeTone> = { submitted: "info", assigned: "brand", "in-progress": "warning", resolved: "success" };
const LOST_FOUND: Record<LostFoundStatus, BadgeTone> = { open: "info", claimed: "warning", resolved: "success" };
const SUPPORT: Record<SupportStatus, BadgeTone> = { open: "info", matched: "success", closed: "neutral" };
const FACILITY_PRIORITY: Record<FacilityPriority, BadgeTone> = { low: "neutral", medium: "info", high: "warning", urgent: "danger" };
const ANNOUNCEMENT_PRIORITY: Record<AnnouncementPriority, BadgeTone> = { normal: "neutral", important: "warning", emergency: "danger" };

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={BOOKING[status]}>{humanize(status)}</Badge>;
}
export function FacilityStatusBadge({ status }: { status: FacilityStatus }) {
  return <Badge tone={FACILITY[status]}>{humanize(status)}</Badge>;
}
export function LostFoundStatusBadge({ status }: { status: LostFoundStatus }) {
  return <Badge tone={LOST_FOUND[status]}>{humanize(status)}</Badge>;
}
export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  return <Badge tone={SUPPORT[status]}>{humanize(status)}</Badge>;
}
export function FacilityPriorityBadge({ priority }: { priority: FacilityPriority }) {
  return <Badge tone={FACILITY_PRIORITY[priority]}>{humanize(priority)} priority</Badge>;
}
export function AnnouncementPriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  if (priority === "normal") return null;
  return <Badge tone={ANNOUNCEMENT_PRIORITY[priority]}>{humanize(priority)}</Badge>;
}
