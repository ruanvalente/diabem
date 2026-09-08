import Dexie from "dexie";
import { getDatabase } from "../database";
import type {
  ConnectedDevice,
  SyncHistoryEntry,
} from "../../devices/types/device.types";

/**
 * Repository for the Device Registry (Sprint 9).
 *
 * Persists device metadata and sync history. Only non-sensitive metadata is
 * stored — never credentials or pairing secrets (per the privacy contract in
 * the plan). Like the other repositories, it scopes queries by `userId`.
 *
 * NOTE: device registry records contain no free-text health data, so they are
 * NOT encrypted at rest (consistent with the app's rule of encrypting only
 * sensitive free-text fields).
 */

function getDevicesTable(): Dexie.Table<ConnectedDevice, string> {
  return getDatabase().devices as Dexie.Table<ConnectedDevice, string>;
}

function getHistoryTable(): Dexie.Table<SyncHistoryEntry, string> {
  return getDatabase().syncHistory as Dexie.Table<SyncHistoryEntry, string>;
}

async function register(device: ConnectedDevice): Promise<void> {
  await getDevicesTable().put(device);
}

async function findByUser(userId: string): Promise<ConnectedDevice[]> {
  return getDevicesTable().where("userId").equals(userId).toArray();
}

async function findById(
  userId: string,
  deviceId: string
): Promise<ConnectedDevice | undefined> {
  return getDevicesTable()
    .where("id")
    .equals(deviceId)
    .and((record) => record.userId === userId)
    .first();
}

async function remove(userId: string, deviceId: string): Promise<void> {
  await getDevicesTable()
    .where("id")
    .equals(deviceId)
    .and((record) => record.userId === userId)
    .delete();
}

async function addHistory(entry: SyncHistoryEntry): Promise<void> {
  await getHistoryTable().add(entry);
}

async function historyByUser(userId: string): Promise<SyncHistoryEntry[]> {
  return getHistoryTable()
    .where("userId")
    .equals(userId)
    .reverse()
    .sortBy("syncedAt");
}

async function clearHistory(userId: string): Promise<void> {
  await getHistoryTable().where("userId").equals(userId).delete();
}

export const deviceRepository = {
  register,
  findByUser,
  findById,
  remove,
  addHistory,
  historyByUser,
  clearHistory,
};
