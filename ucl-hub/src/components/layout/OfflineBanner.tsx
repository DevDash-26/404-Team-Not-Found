"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <WifiOff className="size-4" aria-hidden="true" />
      You&apos;re offline. You can keep reading recently viewed content; changes need a connection.
    </div>
  );
}
