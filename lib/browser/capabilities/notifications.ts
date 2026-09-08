/**
 * Capability detection for the Notifications API.
 *
 * Detection is safe to call during Server-Side Rendering: browser-only globals
 * are never accessed in a non-browser context. Secure context (HTTPS) and user
 * gesture requirements are modelled here so the rest of the application never
 * has to inspect `window` directly.
 */

import { isBrowser, isSecureContext } from "../environment";

/**
 * Result of the capability check for notifications.
 */
export type NotificationCapability = {
  supported: boolean;
  /** Whether the current document runs in a secure context (needed by the API). */
  secureContext: boolean;
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
    return { supported: false, secureContext: false };
  }

  const secureContext = isSecureContext();

  const supported =
    secureContext &&
    typeof window !== "undefined" &&
    "Notification" in window;

  return { supported, secureContext };
}

export const notificationsSupported = (): boolean =>
  notificationsCapability().supported;