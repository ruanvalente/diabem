import type { NotificationPermissionState } from "../capabilities/notifications";

export type { NotificationPermissionState };

export type NotificationTransport = "service-worker" | "constructor";

export type NotificationFailureReason =
  | "unsupported"
  | "permission-denied"
  | "permission-not-granted"
  | "show-failed";

export type NotificationPayload = {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
};

export type NotifyResult =
  | { ok: true; transport: NotificationTransport }
  | {
      ok: false;
      reason: NotificationFailureReason;
      fallback: true;
    };

export type RequestPermissionResult =
  | { ok: true; permission: NotificationPermissionState }
  | {
      ok: false;
      reason: Extract<NotificationFailureReason, "unsupported" | "permission-denied">;
      permission: NotificationPermissionState;
    };
