import { COLLECTIONS } from "@/lib/backend/collections";
import type { DataStore } from "@/lib/backend/types";
import { createCrudService } from "@/services/crud";
import type { CampusService, StaffContact } from "@/types";
import { systemClock, type Clock } from "@/utils/clock";
import type { ServiceInput, StaffContactInput } from "./schema";

export function createServiceDirectoryService(store: DataStore, clock: Clock = systemClock) {
  const services = createCrudService<CampusService>(store, COLLECTIONS.services);
  const staff = createCrudService<StaffContact>(store, COLLECTIONS.staffDirectory);
  const stamp = () => clock.now().toISOString();

  return {
    listServices: () => services.listAll({ orderBy: [{ field: "name" }] }),
    getService: services.get,
    createService: (input: ServiceInput) => services.create({ ...input, updatedAt: stamp() }),
    updateService: (id: string, input: ServiceInput) => services.update(id, { ...input, updatedAt: stamp() }),
    removeService: services.remove,

    listStaff: () => staff.listAll({ orderBy: [{ field: "name" }] }),
    createStaff: (input: StaffContactInput) => staff.create({ ...input, updatedAt: stamp() }),
    updateStaff: (id: string, input: StaffContactInput) => staff.update(id, { ...input, updatedAt: stamp() }),
    removeStaff: staff.remove,
  };
}

export type ServiceDirectoryService = ReturnType<typeof createServiceDirectoryService>;
