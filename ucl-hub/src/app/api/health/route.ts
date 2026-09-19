import { json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Lightweight liveness probe for hosting platforms. Reveals nothing about configuration. */
export function GET(): Response {
  return json({ status: "ok" });
}
