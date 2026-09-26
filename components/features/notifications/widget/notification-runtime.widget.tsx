"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/use-auth";
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
