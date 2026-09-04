/**
 * ReminderService
 *
 * User-configured reminders backed by `localStorage` (a simple key-value store
 * of preferences, per the project's local-first rules). Reminders are persisted
 * on-device and fire a browser notification while the document is open. No
 * Background Sync / Periodic Background Sync is implemented (explicitly out of
 * scope for this sprint), so notifications are delivered while the app is open.
 *
 * Privacy: reminder content is intentionally generic and non-sensitive so it is
 * safe to surface on a locked screen.
 */

import { isBrowser } from "../environment";

export type Reminder = {
  id: string;
  title: string;
  scheduledAt: string;
  createdAt: string;
};

const STORAGE_KEY = "diabem.reminders";
const MAX_REMINDERS = 50;

export function listReminders(): Reminder[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReminder);
  } catch {
    return [];
  }
}

export function saveReminder(input: Omit<Reminder, "id" | "createdAt">) {
  const next: Reminder = {
    id: cryptoRandomId(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  const reminders = listReminders();
  if (reminders.length >= MAX_REMINDERS) {
    reminders.shift();
  }
  reminders.push(next);
  persist(reminders);
  return next;
}

export function deleteReminder(id: string) {
  persist(listReminders().filter((r) => r.id !== id));
}

export function clearReminders() {
  persist([]);
}

function persist(reminders: Reminder[]) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch {
    // Storage full/unavailable: drop silently (degraded mode, no throw).
  }
}

function isReminder(value: unknown): value is Reminder {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.scheduledAt === "string" &&
    typeof v.createdAt === "string"
  );
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `rem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const reminderService = {
  list: listReminders,
  save: saveReminder,
  remove: deleteReminder,
  clear: clearReminders,
};