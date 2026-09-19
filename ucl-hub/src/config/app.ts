/**
 * Central application configuration.
 *
 * Every limit, default and tunable used by the app lives here so that nothing
 * is a "magic number" scattered through components or services. Values that an
 * administrator may change at runtime (for example booking hours) are defaults
 * here and can be overridden through the `settings/app` document.
 */

export const APP = {
  name: "UCL Campus Hub",
  shortName: "UCL Hub",
  institution: "Universal College Lanka",
  supportEmail: "hub@ucl.example",
} as const;

export const PAGINATION = {
  /** Cards/rows fetched per page on student-facing lists. */
  pageSize: 6,
  /** Rows per page in admin tables. */
  adminPageSize: 20,
  /**
   * When client-side filters hide most of a page, we keep fetching further
   * pages (up to this many) so the user does not see a misleadingly empty list.
   */
  maxAutoFetchPages: 4,
} as const;

export const UPLOAD = {
  maxImageBytes: 5 * 1024 * 1024,
  maxAttachmentBytes: 10 * 1024 * 1024,
  /** Images are downscaled in the browser before upload to save bandwidth. */
  imageMaxDimension: 1280,
  imageQuality: 0.82,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedAttachmentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
} as const;

export const BOOKING_DEFAULTS = {
  /** Booking granularity. Every booking occupies whole slots of this length. */
  slotMinutes: 30,
  openTime: "08:00",
  closeTime: "20:00",
  maxHours: 3,
  /** How far ahead a room can be requested. */
  advanceBookingDays: 30,
} as const;

export const NOTIFICATIONS = {
  fetchLimit: 30,
  readStateLimit: 300,
  /** Events the student is interested in trigger a reminder this many hours ahead. */
  reminderWindowHours: 24,
} as const;

export const DASHBOARD = {
  upcomingEvents: 4,
  calendarReminders: 4,
  recentAnnouncements: 4,
  jobs: 3,
  calendarLookAheadDays: 45,
} as const;

export const FIELD_LIMITS = {
  title: 140,
  shortText: 200,
  description: 4000,
  message: 2000,
  name: 100,
} as const;

export const AI = {
  maxQuestionChars: 500,
  /** How many previous chat turns are sent along with a new question. */
  historyTurns: 6,
  /** Retrieved knowledge documents placed in the prompt. */
  contextDocs: 6,
  /** BM25 scores below this are treated as noise (nothing relevant found). */
  minScore: 1.5,
  /** Keep only results scoring at least this fraction of the best result. */
  relativeCutoff: 0.35,
  rateLimitPerMinute: 20,
  requestTimeoutMs: 15000,
  knowledgeCacheTtlMs: 60_000,
  maxOutputTokens: 500,
} as const;

export const STORAGE_KEYS = {
  memoryDb: "ucl-hub:memory-db:v4",
  memorySession: "ucl-hub:memory-session:v1",
  assistantChat: "ucl-hub:assistant-chat:v1",
} as const;
