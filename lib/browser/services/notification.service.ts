/**
 * NotificationService
 *
 * Encapsulates the Notifications API behind a small, domain-friendly interface.
 * UI components MUST NOT call `Notification.*` directly; they should use this
 * service (or the feature hooks/widgets built on top of it).
 *
 * Responsibilities:
 * - capability / permission state detection;
 * - requesting permission (only on explicit user action);
 * - sending a notification;
 * - treating errors and providing a safe fallback;
 * - respecting secure-context requirements.
 */

import { notificationsCapability } from "../capabilities/notifications";
import { isBrowser } from "../environment";
import type {
  DialNotificationOptions,
  NotificationErrorReason,
  NotificationPermissionState,
} from "./notification.types";

export type RequestPermissionResult =
  | { ok: true; permission: Exclude<NotificationPermissionState, "unsupported"> }
  | { ok: false; reason: NotificationErrorReason };

class NotificationService {
  isSupported(): boolean {
    return notificationsCapability().supported;
  }

  /**
   * Current notification permission state. Returns `"unsupported"` when the
   * API is not available (during SSR or in insecure/unsupported browsers).
   */
  getPermission(): NotificationPermissionState {
    if (!this.isSupported() || !isBrowser) return "unsupported";

    try {
      return window.Notification.permission;
    } catch {
      return "unsupported";
    }
  }

  /**
   * Request notification permission. MUST only be called as a direct result of
   * a user gesture (never on app load).
   *
   * @returns a discriminated result; the UI should present a distinct message
   * when permission is denied or when the request fails.
   */
  async requestPermission(): Promise<RequestPermissionResult> {
    if (!this.isSupported() || !isBrowser) {
      return { ok: false, reason: "unsupported" };
    }

    try {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        return { ok: true, permission };
      }
      return { ok: false, reason: "permission-denied" };
    } catch {
      return { ok: false, reason: "unknown" };
    }
  }

  /**
   * Send a notification.
   *
   * Notifications include a generic, non-sensitive body by default to avoid
   * leaking health data on the lockscreen (privacy by design).
   */
  async notify(options: DialNotificationOptions): Promise<
    | { ok: true }
    | { ok: false; reason: NotificationErrorReason }
    | { ok: false; fallback: true; reason: NotificationErrorReason }
  > {
    if (!this.isSupported() || !isBrowser) {
      return { ok: false, fallback: true, reason: "unsupported" };
    }

    if (window.Notification.permission !== "granted") {
      return {
        ok: false,
        fallback: true,
        reason: "permission-denied",
      };
    }

    try {
      const notification = new window.Notification(options.title, {
        body: options.body,
        tag: "diabem-reminder",
        data: { url: "/app" },
        badge: "/icons/icon-192.png",
        icon: "/icons/icon-192.png",
      });

      // Do not keep DOM references and prevent GC from closing prematurely.
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return { ok: true };
    } catch {
      return { ok: false, fallback: true, reason: "unknown" };
    }
  }
}

export const notificationService = new NotificationService();

export type NotificationServiceInstance = NotificationService;