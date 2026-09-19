import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import { readAllPages } from "@/services/paging";
import type { ActorRef, FacilityIssue, FacilityStatus } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { AppError } from "@/utils/errors";
import { humanize } from "@/utils/text";
import { canTransitionFacility } from "./logic";
import type { FacilityIssueInput } from "./schema";

export function createFacilityService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<FacilityIssue>(store, COLLECTIONS.facilityIssues);

  return {
    async create(input: FacilityIssueInput, reporter: ActorRef): Promise<string> {
      const at = clock.now().toISOString();
      return crud.create({
        ...input,
        status: "submitted",
        reporter,
        assignedTo: null,
        updates: [{ status: "submitted", note: "Issue reported.", by: reporter.name, at }],
        createdAt: at,
        updatedAt: at,
      });
    },

    async listMine(userId: string): Promise<FacilityIssue[]> {
      const items = await readAllPages((after) =>
        store.list<FacilityIssue>(COLLECTIONS.facilityIssues, {
          where: [{ field: "reporter.id", op: "==", value: userId }],
          limit: 100,
          after,
        }),
      );
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    /** Work queue for facilities/IT staff, newest first. */
    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<FacilityIssue>> {
      return crud.list({ orderBy: [{ field: "createdAt", direction: "desc" }], limit: pageSize, after: cursor });
    },

    get: crud.get,

    /**
     * Moves an issue to its next status, records who did what in the history and
     * notifies the student who reported it, all in one atomic write.
     */
    async advance(issue: FacilityIssue, next: FacilityStatus, note: string, staff: ActorRef): Promise<void> {
      if (!canTransitionFacility(issue.status, next)) {
        throw new AppError("validation", `An issue that is ${humanize(issue.status).toLowerCase()} can't move to ${humanize(next).toLowerCase()}.`);
      }
      const at = clock.now().toISOString();
      const trimmed = note.trim();
      const entry = {
        status: next,
        note: trimmed || `Status changed to ${humanize(next).toLowerCase()}.`,
        by: staff.name,
        at,
      };
      await crud.update(
        issue.id,
        {
          status: next,
          assignedTo: issue.assignedTo ?? staff,
          updates: [...issue.updates, entry],
          updatedAt: at,
        },
        [
          notificationOp(
            store,
            {
              title: `Update on your report: ${humanize(issue.category)}`,
              body: `Now ${humanize(next).toLowerCase()}. ${entry.note}`,
              type: "facility",
              link: "/facilities",
              recipientId: issue.reporter.id,
              createdBy: staff.id,
            },
            clock,
          ),
        ],
      );
    },

    remove: crud.remove,
  };
}

export type FacilityService = ReturnType<typeof createFacilityService>;
