import Dexie, { type Table } from "dexie";
import type {
  Activity,
  GlucoseReading,
  LocalSession,
  Meal,
  Note,
  User,
} from "./types";
import type {
  ConnectedDevice,
  SyncHistoryEntry,
} from "../devices/types/device.types";

const DB_NAME = "diabem";
const DB_VERSION = 4;

class DiaBemDatabase extends Dexie {
  users!: Table<User, string>;
  sessions!: Table<LocalSession, string>;
  glucoseReadings!: Table<GlucoseReading, string>;
  meals!: Table<Meal, string>;
  activities!: Table<Activity, string>;
  notes!: Table<Note, string>;
  /** Registered devices (Device Registry). */
  devices!: Table<ConnectedDevice, string>;
  /** Device sync history for the current user. */
  syncHistory!: Table<SyncHistoryEntry, string>;

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
    this.version(DB_VERSION).stores({
      users: "id, email, createdAt, keySalt",
      glucoseReadings: "id, userId, [userId+measuredAt], [userId+context]",
      meals: "id, userId, [userId+consumedAt], [userId+type]",
      activities: "id, userId, [userId+startedAt], [userId+type]",
      notes: "id, userId, [userId+createdAt]",
      devices: "id, userId, adapterId, transport, lastSyncAt",
      syncHistory: "id, userId, deviceId, syncedAt",
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