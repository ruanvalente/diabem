/**
 * Shared types for the Notifications feature.
 *
 * The Application layer (components/widgets) should rely on these types rather
 * than on the raw `Notification` browser interface so implementations can be
 * swapped/tested.
 */

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "default"
  | "unsupported";

export type DialNotificationOptions = {
  title: string;
  body?: string;
};

export type NotificationErrorReason =
  | "unsupported"
  | "permission-denied"
  | "insecure-context"
  | "unknown";