"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useServices } from "@/components/providers/ServicesProvider";
import { useAsyncData } from "@/hooks/useAsyncData";
import { onNotificationsChanged } from "@/lib/appEvents";
import { unreadCount } from "@/features/notifications/logic";

const REFRESH_MS = 60_000;

export function NotificationBell() {
  const { notifications } = useServices();
  const { profile } = useAuth();
  const { data, reload } = useAsyncData(() => (profile ? notifications.getFeed(profile) : Promise.resolve([])), [notifications, profile?.id]);

  useEffect(() => {
    const timer = setInterval(reload, REFRESH_MS);
    const off = onNotificationsChanged(reload);
    return () => {
      clearInterval(timer);
      off();
    };
  }, [reload]);

  const unread = data ? unreadCount(data) : 0;
  return (
    <Link href="/notifications" className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
