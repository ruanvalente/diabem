/**
 * Abstraction over the browser Notifications API.
 *
 * The domain never touches `window.Notification` or `navigator.serviceWorker`
 * directly: both live here. Display prefers the registered Service Worker (so
 * the notification survives the page that created it) and falls back to the
 * constructor when no registration is available.
 */

import { isBrowser } from "../environment";
import {
  notificationPermissionState,
  notificationsSupported,
} from "../capabilities/notifications";
import type { NotificationPermissionState } from "../capabilities/notifications";
import type {
  NotifyResult,
  NotificationPayload,
  RequestPermissionResult,
} from "./notification.types";

const ALLOWED_ROUTE_PATTERN = /^\/(dashboard|timeline|glucose|meals|activity|notes|medications|statistics|reports|settings)(\/[a-z0-9-]+)*$/;

function sanitizeBody(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 200);
}

function sanitizeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (!value.startsWith("/")) return undefined;
  if (!ALLOWED_ROUTE_PATTERN.test(value.split("?")[0].split("#")[0])) return "/dashboard";
  return value;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isBrowser || typeof navigator === "undefined") return null;
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ?? null;
  } catch {
    return null;
  }
}

function isSupported(): boolean {
  return notificationsSupported();
}

function getPermission(): NotificationPermissionState {
  return notificationPermissionState();
}

async function requestPermission(): Promise<RequestPermissionResult> {
  if (!isSupported()) {
    return { ok: false, reason: "unsupported", permission: "unsupported" };
  }
  try {
    const permission = (await window.Notification.requestPermission()) as NotificationPermissionState;
    if (permission === "granted") return { ok: true, permission };
    return { ok: false, reason: "permission-denied", permission };
  } catch {
    return { ok: false, reason: "unsupported", permission: "unsupported" };
  }
}

async function show(payload: NotificationPayload): Promise<NotifyResult> {
  if (!isSupported()) {
    return { ok: false, reason: "unsupported", fallback: true };
  }

  const permission = window.Notification.permission;
  if (permission === "denied") {
    return { ok: false, reason: "permission-denied", fallback: true };
  }
  if (permission !== "granted") {
    return { ok: false, reason: "permission-not-granted", fallback: true };
  }

  const options: NotificationOptions = {
    body: payload.body ? sanitizeBody(payload.body) : undefined,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    requireInteraction: false,
    silent: true,
    data: { url: sanitizeUrl(payload.url) ?? "/dashboard" },
  };

  const registration = await getServiceWorkerRegistration();
  if (registration) {
    try {
      await registration.showNotification(sanitizeBody(payload.title), options);
      return { ok: true, transport: "service-worker" };
    } catch {
      return { ok: false, reason: "show-failed", fallback: true };
    }
  }

  try {
    const notification = new window.Notification(sanitizeBody(payload.title), options);
    // Without a Service Worker there is no `notificationclick` handler, so the
    // constructor transport has to handle the click itself. Not holding the
    // reference lets the browser collect the notification once it is closed.
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    if (typeof notification.close === "function") {
      window.setTimeout(() => notification.close(), 15_000);
    }
    return { ok: true, transport: "constructor" };
  } catch {
    return { ok: false, reason: "show-failed", fallback: true };
  }
}

async function close(tag: string): Promise<number> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return 0;
  try {
    const notifications = await registration.getNotifications({ tag });
    notifications.forEach((notification) => notification.close());
    return notifications.length;
  } catch {
    return 0;
  }
}

async function closeAll(): Promise<number> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) return 0;
  try {
    const notifications = await registration.getNotifications();
    notifications.forEach((notification) => notification.close());
    return notifications.length;
  } catch {
    return 0;
  }
}

export const notificationService = {
  isSupported,
  getPermission,
  requestPermission,
  show,
  close,
  closeAll,
};
