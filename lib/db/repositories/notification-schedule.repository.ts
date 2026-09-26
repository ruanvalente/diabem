import type Dexie from "dexie";
import { getDatabase } from "../database";
import {
  NOTIFICATION_DEFAULT_QUIET_HOURS,
  type NotificationPreferences,
  type NotificationPreferencesInput,
  type NotificationSchedule,
  type NotificationScheduleInput,
} from "../../notifications/types";
import {
  validateNotificationPreferencesInput,
  validateNotificationScheduleInput,
} from "../../notifications/notification-schedule.validation";
import { resolveTimeZone } from "../../notifications/notification-recurrence";

function schedulesTable(): Dexie.Table<NotificationSchedule, string> {
  return getDatabase().notificationSchedules;
}

function preferencesTable(): Dexie.Table<NotificationPreferences, string> {
  return getDatabase().notificationPreferences;
}

/**
 * Creates a schedule for the given user. Throws when the input is invalid;
 * the caller decides how to surface the message.
 */
async function create(
  userId: string,
  data: NotificationScheduleInput,
): Promise<NotificationSchedule> {
  if (!userId) throw new Error("Usuário inválido para criar lembrete.");
  const validation = validateNotificationScheduleInput(data);
  if (!validation.data) throw new Error(validation.error ?? "Lembrete inválido.");

  const now = new Date().toISOString();
  const record: NotificationSchedule = {
    ...validation.data,
    id: crypto.randomUUID(),
    userId,
    timeZone: resolveTimeZone(validation.data.timeZone),
    lastOccurrenceKey: null,
    createdAt: now,
    updatedAt: now,
  };

  await schedulesTable().add(record);
  return record;
}

/**
 * Reads one schedule scoped to the owner. A record belonging to another user is
 * reported as missing, so ownership can never be probed by the difference
 * between `undefined` and a rejection.
 */
async function findById(userId: string, id: string): Promise<NotificationSchedule | undefined> {
  const record = await schedulesTable().get(id);
  if (!record || record.userId !== userId) return undefined;
  return record;
}

/** Every schedule of the user, ordered by time then creation. */
async function findByUser(userId: string): Promise<NotificationSchedule[]> {
  const records = await schedulesTable().where("userId").equals(userId).toArray();
  return records.sort((a, b) => a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt));
}

/** Only the enabled schedules of the user, which is what the scheduler loads. */
async function getEnabledSchedules(userId: string): Promise<NotificationSchedule[]> {
  const records = await schedulesTable().where("userId").equals(userId).toArray();
  return records
    .filter((record) => record.enabled)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Merges a partial change into an existing schedule. The merged result is
 * revalidated, so an update that would produce an invalid record is rejected
 * and nothing is persisted. Returns `undefined` when the id is not the user's.
 */
async function update(
  userId: string,
  id: string,
  data: Partial<NotificationScheduleInput>,
): Promise<NotificationSchedule | undefined> {
  const existing = await findById(userId, id);
  if (!existing) return undefined;

  const merged = {
    label: data.label ?? existing.label,
    period: data.period ?? existing.period,
    time: data.time ?? existing.time,
    enabled: data.enabled ?? existing.enabled,
    daysOfWeek: data.daysOfWeek ?? existing.daysOfWeek,
    reminderTypes: data.reminderTypes ?? existing.reminderTypes,
    timeZone: data.timeZone ?? existing.timeZone,
  };

  const validation = validateNotificationScheduleInput(merged);
  if (!validation.data) throw new Error(validation.error ?? "Lembrete inválido.");

  const updated: NotificationSchedule = {
    ...existing,
    ...validation.data,
    timeZone: resolveTimeZone(validation.data.timeZone),
    updatedAt: new Date().toISOString(),
  };

  await schedulesTable().put(updated);
  return updated;
}

async function setEnabled(
  userId: string,
  id: string,
  enabled: boolean,
): Promise<NotificationSchedule | undefined> {
  return update(userId, id, { enabled });
}

/**
 * Records the occurrence already delivered, so the scheduler does not repeat it.
 * This also bumps `updatedAt`, which reorders the `[userId+updatedAt]` index: the
 * occurrence key is bookkeeping, not a user edit, and callers must not depend on
 * that ordering afterwards.
 */
async function markOccurrence(
  userId: string,
  id: string,
  occurrenceKey: string,
): Promise<void> {
  const existing = await findById(userId, id);
  if (!existing) return;
  await schedulesTable().put({
    ...existing,
    lastOccurrenceKey: occurrenceKey,
    updatedAt: new Date().toISOString(),
  });
}

/** Deletes one schedule. Returns `false` when the id is not the user's. */
async function deleteById(userId: string, id: string): Promise<boolean> {
  const existing = await findById(userId, id);
  if (!existing) return false;
  await schedulesTable().delete(id);
  return true;
}

async function deleteAll(userId: string): Promise<number> {
  return schedulesTable().where("userId").equals(userId).delete();
}

/**
 * Returns the preferences of the user, persisting the defaults on first read.
 * This is a write on a read path: a caller that only needs to know whether
 * reminders are enabled will still create the record, and a `readonly` caller
 * must not assume the store stays untouched.
 */
async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const existing = await preferencesTable().get(userId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const created: NotificationPreferences = {
    userId,
    enabled: false,
    quietHours: { ...NOTIFICATION_DEFAULT_QUIET_HOURS },
    timeZone: resolveTimeZone(),
    createdAt: now,
    updatedAt: now,
  };
  await preferencesTable().put(created);
  return created;
}

/** Replaces the preferences of the user after validating the input. */
async function updatePreferences(
  userId: string,
  data: NotificationPreferencesInput,
): Promise<NotificationPreferences> {
  const validation = validateNotificationPreferencesInput(data);
  if (!validation.data) throw new Error(validation.error ?? "Preferências inválidas.");
  const existing = await getPreferences(userId);
  const updated: NotificationPreferences = {
    ...existing,
    ...validation.data,
    timeZone: resolveTimeZone(validation.data.timeZone),
    updatedAt: new Date().toISOString(),
  };
  await preferencesTable().put(updated);
  return updated;
}

async function deletePreferences(userId: string): Promise<void> {
  await preferencesTable().delete(userId);
}

export const notificationScheduleRepository = {
  create,
  findById,
  findByUser,
  getEnabledSchedules,
  update,
  setEnabled,
  markOccurrence,
  deleteById,
  deleteAll,
  getPreferences,
  updatePreferences,
  deletePreferences,
};
