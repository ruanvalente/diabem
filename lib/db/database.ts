import Dexie, { type Table } from "dexie";
import type {
  Activity,
  GlucoseReading,
  LocalSession,
  Meal,
  Medication,
  Note,
  User,
} from "./types";
import type {
  ConnectedDevice,
  SyncHistoryEntry,
} from "../devices/types/device.types";
import type { AuditEntry } from "../audit/audit.types";
import type {
  NotificationPreferences,
  NotificationSchedule,
} from "../notifications/types";

const DB_NAME = "diabem";
const DB_VERSION = 7;

class DiaBemDatabase extends Dexie {
  users!: Table<User, string>;
  sessions!: Table<LocalSession, string>;
  glucoseReadings!: Table<GlucoseReading, string>;
  meals!: Table<Meal, string>;
  activities!: Table<Activity, string>;
  notes!: Table<Note, string>;
  /** Medication intake records (Sprint 12). */
  medications!: Table<Medication, string>;
  /** User-owned notification schedules (Sprint 15). */
  notificationSchedules!: Table<NotificationSchedule, string>;
  /** Per-user notification preferences, keyed by userId (Sprint 15). */
  notificationPreferences!: Table<NotificationPreferences, string>;
  /** Registered devices (Device Registry). */
  devices!: Table<ConnectedDevice, string>;
  /** Device sync history for the current user. */
  syncHistory!: Table<SyncHistoryEntry, string>;
  /** Technical audit trail — no sensitive content (Sprint 11, plan §15). */
  auditTrail!: Table<AuditEntry, string>;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      users: "id, email, createdAt",
      sessions: "id, userId, createdAt",
    });
    this.version(2).stores({
      glucoseReadings: "id, userId, [userId+measuredAt], [userId+context]",
      meals: "id, userId, [userId+consumedAt], [userId+type]",
      activities: "id, userId, [userId+startedAt], [userId+type]",
      notes: "id, userId, [userId+createdAt]",
    });
    this.version(3).stores({
      users: "id, email, createdAt, keySalt",
      glucoseReadings: "id, userId, [userId+measuredAt], [userId+context]",
      meals: "id, userId, [userId+consumedAt], [userId+type]",
      activities: "id, userId, [userId+startedAt], [userId+type]",
      notes: "id, userId, [userId+createdAt]",
    });
    this.version(4).stores({
      users: "id, email, createdAt, keySalt",
      glucoseReadings: "id, userId, [userId+measuredAt], [userId+context]",
      meals: "id, userId, [userId+consumedAt], [userId+type]",
      activities: "id, userId, [userId+startedAt], [userId+type]",
      notes: "id, userId, [userId+createdAt]",
      devices: "id, userId, adapterId, transport, lastSyncAt",
      syncHistory: "id, userId, deviceId, syncedAt",
    });
    this.version(DB_VERSION).stores({
      users: "id, email, createdAt, keySalt",
      glucoseReadings: "id, userId, [userId+measuredAt], [userId+context]",
      meals: "id, userId, [userId+consumedAt], [userId+type]",
      activities: "id, userId, [userId+startedAt], [userId+type]",
      notes: "id, userId, [userId+createdAt]",
      medications: "id, userId, [userId+medicatedAt]",
      devices: "id, userId, adapterId, transport, lastSyncAt",
      syncHistory: "id, userId, deviceId, syncedAt",
      auditTrail: "id, userId, [userId+timestamp], entity, entityId, action",
      notificationSchedules: "id, userId, [userId+updatedAt], [userId+period]",
      notificationPreferences: "userId, updatedAt",
    });
  }
}

let dbInstance: DiaBemDatabase | null = null;

export function getDatabase(): DiaBemDatabase {
  if (!dbInstance) {
    dbInstance = new DiaBemDatabase();
  }
  return dbInstance;
}

export type { DiaBemDatabase };