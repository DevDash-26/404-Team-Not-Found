import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import type { AppSettings } from "@/types";
import type { SettingsInput } from "./schema";

export function createSettingsService(store: DataStore) {
  const path = `${COLLECTIONS.settings}/${SETTINGS_DOC_ID}`;

  return {
    get: () => store.get<AppSettings>(path),

    /** Creates or replaces the single app settings document. */
    async save(input: SettingsInput): Promise<void> {
      await store.commit([{ kind: "set", path, data: { ...input } }]);
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
