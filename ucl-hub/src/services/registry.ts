/**
 * Service registry: the one place where concrete services are wired to the
 * backend. UI code calls `getServices()` (usually through the `useServices`
 * hook) and never constructs stores or talks to Firebase directly.
 */

import { createAssistantClient, type AssistantClient } from "@/features/ai/client";
import { createKnowledgeService, type KnowledgeService } from "@/features/ai/knowledgeService";
import { createAnalyticsService, type AnalyticsService } from "@/features/analytics/service";
import { createAnnouncementService, type AnnouncementService } from "@/features/announcements/service";
import { createCalendarService, type CalendarService } from "@/features/calendar/service";
import { createClassroomService, type ClassroomService } from "@/features/classrooms/service";
import { createEventService, type EventService } from "@/features/events/service";
import { createFacilityService, type FacilityService } from "@/features/facilities/service";
import { createFaqService, type FaqService } from "@/features/faq/service";
import { createFeedbackService, type FeedbackService } from "@/features/feedback/service";
import { createJobService, type JobService } from "@/features/jobs/service";
import { createLostFoundService, type LostFoundService } from "@/features/lost-found/service";
import { createNotificationService, type NotificationService } from "@/features/notifications/service";
import { createServiceDirectoryService, type ServiceDirectoryService } from "@/features/services/service";
import { createSettingsService, type SettingsService } from "@/features/settings/service";
import { createSocietyService, type SocietyService } from "@/features/societies/service";
import { createSupportService, type SupportService } from "@/features/support/service";
import { createUserService, type UserService } from "@/features/users/service";
import { getBackend } from "@/lib/backend";
import type { AuthPort, FileStore } from "@/lib/backend/types";

export interface Services {
  mode: "firebase" | "memory";
  auth: AuthPort;
  files: FileStore;
  announcements: AnnouncementService;
  events: EventService;
  societies: SocietyService;
  lostFound: LostFoundService;
  classrooms: ClassroomService;
  facilities: FacilityService;
  calendar: CalendarService;
  jobs: JobService;
  support: SupportService;
  directory: ServiceDirectoryService;
  faqs: FaqService;
  notifications: NotificationService;
  feedback: FeedbackService;
  users: UserService;
  settings: SettingsService;
  analytics: AnalyticsService;
  knowledge: KnowledgeService;
  assistant: AssistantClient;
}

let servicesPromise: Promise<Services> | null = null;

export function getServices(): Promise<Services> {
  if (!servicesPromise) {
    servicesPromise = getBackend().then((backend): Services => {
      const { store } = backend;
      return {
        mode: backend.mode,
        auth: backend.auth,
        files: backend.files,
        announcements: createAnnouncementService(store),
        events: createEventService(store),
        societies: createSocietyService(store),
        lostFound: createLostFoundService(store),
        classrooms: createClassroomService(store),
        facilities: createFacilityService(store),
        calendar: createCalendarService(store),
        jobs: createJobService(store),
        support: createSupportService(store),
        directory: createServiceDirectoryService(store),
        faqs: createFaqService(store),
        notifications: createNotificationService(store),
        feedback: createFeedbackService(store),
        users: createUserService(store, backend.admin),
        settings: createSettingsService(store),
        analytics: createAnalyticsService(store),
        knowledge: createKnowledgeService(store),
        assistant: createAssistantClient(backend),
      };
    });
    // A failed start-up (for example a bad Firebase config) must not be cached forever.
    servicesPromise.catch(() => {
      servicesPromise = null;
    });
  }
  return servicesPromise;
}
