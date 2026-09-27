"use client";

import { useAuth } from "@/lib/auth/use-auth";
import { useDeliveredNotificationCount } from "../hooks/use-delivered-notification-count";
import { NotificationBell } from "../ui/notification-bell.ui";

/**
 * Header entry point of the notification feature. Reads the number of
 * notifications presented to the current user during the current session and
 * renders the bell.
 */
export function NotificationIndicator() {
  const { user } = useAuth();
  const count = useDeliveredNotificationCount(user?.id ?? null);

  return <NotificationBell count={count} />;
}
