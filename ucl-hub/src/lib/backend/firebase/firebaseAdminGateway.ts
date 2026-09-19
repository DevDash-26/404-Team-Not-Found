/**
 * Calls this app's privileged API routes (`/api/admin/users`). The routes verify
 * the caller's ID token and re-check the administrator claim on the server, so
 * a tampered browser cannot grant itself access.
 */

import { callApi } from "../apiClient";
import type { AccessUpdate, AdminGateway, AuthPort, CreateUserInput } from "../types";

export class ApiAdminGateway implements AdminGateway {
  constructor(private readonly auth: AuthPort) {}

  createUser(input: CreateUserInput): Promise<{ uid: string }> {
    return callApi(this.auth, "POST", "/api/admin/users", input);
  }

  async updateAccess(uid: string, update: AccessUpdate): Promise<void> {
    await callApi(this.auth, "PATCH", `/api/admin/users/${encodeURIComponent(uid)}`, update);
  }
}
