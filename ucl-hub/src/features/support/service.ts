import { PAGINATION } from "@/config/app";
import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore, Page } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import { notificationOp } from "@/services/notificationOps";
import { readAllPages } from "@/services/paging";
import type { ActorRef, SupportRequest, UserProfile } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import { AppError } from "@/utils/errors";
import { humanize } from "@/utils/text";
import { canTransitionSupport } from "./logic";
import type { SupportDecisionInput, SupportRequestInput } from "./schema";

export function createSupportService(store: DataStore, clock: Clock = systemClock) {
  const crud = createCrudService<SupportRequest>(store, COLLECTIONS.supportRequests);

  return {
    create(input: SupportRequestInput, student: Pick<UserProfile, "id" | "name" | "faculty" | "programme" | "year">): Promise<string> {
      const at = clock.now().toISOString();
      return crud.create({
        ...input,
        status: "open",
        requester: { id: student.id, name: student.name },
        faculty: student.faculty,
        programme: student.programme,
        year: student.year,
        matchedWith: null,
        staffNote: "",
        createdAt: at,
        updatedAt: at,
      });
    },

    async listMine(userId: string): Promise<SupportRequest[]> {
      const items = await readAllPages((after) =>
        store.list<SupportRequest>(COLLECTIONS.supportRequests, {
          where: [{ field: "requester.id", op: "==", value: userId }],
          limit: 100,
          after,
        }),
      );
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    listAll(cursor?: unknown, pageSize: number = PAGINATION.adminPageSize): Promise<Page<SupportRequest>> {
      return crud.list({ orderBy: [{ field: "createdAt", direction: "desc" }], limit: pageSize, after: cursor });
    },

    /** A student withdraws their own request. */
    async close(request: SupportRequest): Promise<void> {
      await crud.update(request.id, { status: "closed", updatedAt: clock.now().toISOString() });
    },

    /** Staff match a student with a tutor/mentor/group, or close the request, and notify the student. */
    async decide(request: SupportRequest, input: SupportDecisionInput, staff: ActorRef): Promise<void> {
      if (!canTransitionSupport(request.status, input.status)) {
        throw new AppError("validation", `A ${request.status} request can't become ${input.status}.`);
      }
      const matchedWith = input.matchedName ? { name: input.matchedName, email: input.matchedEmail } : null;
      await crud.update(
        request.id,
        { status: input.status, matchedWith, staffNote: input.staffNote, updatedAt: clock.now().toISOString() },
        [
          notificationOp(
            store,
            {
              title: `Your ${humanize(request.type).toLowerCase()} request is ${input.status}`,
              body: matchedWith ? `Matched with ${matchedWith.name}. ${input.staffNote}` : input.staffNote || request.subject,
              type: "support",
              link: "/academic-support",
              recipientId: request.requester.id,
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

export type SupportService = ReturnType<typeof createSupportService>;
