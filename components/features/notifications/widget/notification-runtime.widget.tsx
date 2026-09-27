"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { deliveredNotificationLog } from "@/lib/notifications/delivered-notification-log";
import { getNotificationScheduler } from "@/lib/notifications/notification-scheduler.service";

/**
 * Mounts the notification scheduler for the authenticated session. It renders
 * nothing: the scheduler works through the Notifications API and the Service
 * Worker while the application is open.
 */
export function NotificationRuntime() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;

    // The delivered counter is session state, so it starts from zero for every
    // user that opens the application. The read side already hides the previous
    // session, so this only clears the count the returning user sees.
    deliveredNotificationLog.beginSession(userId);

    const scheduler = getNotificationScheduler();
    void scheduler.start(userId);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void scheduler.reload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void scheduler.stop();
    };
  }, [userId]);

  return null;
}
