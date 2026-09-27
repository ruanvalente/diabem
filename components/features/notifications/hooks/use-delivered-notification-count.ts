"use client";

import { useSyncExternalStore } from "react";
import { deliveredNotificationLog } from "@/lib/notifications/delivered-notification-log";

const getServerCount = () => 0;

/**
 * Exposes how many notifications were presented to `userId` during the current
 * session. Any other user reads zero, so the previous session is never shown
 * while the new one is still being announced. The server snapshot is always
 * zero because deliveries only happen in the browser, after hydration.
 */
export function useDeliveredNotificationCount(userId: string | null): number {
  return useSyncExternalStore(
    deliveredNotificationLog.subscribe,
    () => deliveredNotificationLog.getCountFor(userId),
    getServerCount,
  );
}
