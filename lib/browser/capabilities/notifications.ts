/**
 * Capability detection for the Notifications API, Service Worker and local
 * scheduling.
 *
 * Detection is safe to call during Server-Side Rendering: browser-only globals
 * are never accessed in a non-browser context. Secure context (HTTPS) and user
 * gesture requirements are modelled here so the rest of the application never
 * has to inspect `window` directly.
 */

import { isBrowser, isSecureContext } from "../environment";

export type NotificationSchedulingCapability = {
  /**
   * `true` only when the platform can deliver the notification on its own,
   * without the application being open.
   *
   * Always `false` in practice: Notification Triggers were removed from
   * shipping browsers, Periodic Background Sync is still experimental, and Push
   * would require a server this application deliberately does not have. It is
   * modelled as an explicit capability so the settings screen can state the
   * limitation instead of assuming it, and so the field has a home if the
   * platform ever changes.
   */
  reliableBackgroundDelivery: boolean;
};

export type NotificationPermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export type NotificationCapability = {
  supported: boolean;
  /** Whether the current document runs in a secure context (needed by the API). */
  secureContext: boolean;
  /** Whether a Service Worker registration can display notifications. */
  serviceWorker: boolean;
  scheduling: NotificationSchedulingCapability;
};

/**
 * Whether the Notifications API is usable in the current environment.
 *
 * - Returns `false` during SSR.
 * - Requires a secure context (HTTPS or localhost) in most browsers.
 * - Requires `window.Notification`.
 */
export function notificationsCapability(): NotificationCapability {
  if (!isBrowser) {
    return {
      supported: false,
      secureContext: false,
      serviceWorker: false,
      scheduling: { reliableBackgroundDelivery: false },
    };
  }

  const secureContext = isSecureContext();

  const supported =
    secureContext &&
    typeof window !== "undefined" &&
    "Notification" in window;

  const serviceWorker =
    supported && typeof navigator !== "undefined" && "serviceWorker" in navigator;

  return {
    supported,
    secureContext,
    serviceWorker,
    scheduling: { reliableBackgroundDelivery: false },
  };
}

export function notificationPermissionState(): NotificationPermissionState {
  const capability = notificationsCapability();
  if (!capability.supported) return "unsupported";
  return window.Notification.permission;
}

export const notificationsSupported = (): boolean =>
  notificationsCapability().supported;
