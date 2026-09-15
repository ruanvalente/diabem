import Dexie from "dexie";
import { getDatabase } from "../db/database";
import type { AuditEntry } from "./audit.types";

/**
 * Repository for the technical audit trail (Sprint 11, plan §15).
 *
 * Persists lightweight operation records (no sensitive health content).
 * All queries are scoped by `userId`.
 */

function getTable(): Dexie.Table<AuditEntry, string> {
  return getDatabase().auditTrail as Dexie.Table<AuditEntry, string>;
}

async function addEntry(entry: AuditEntry): Promise<void> {
  await getTable().add(entry);
}

async function listByUser(
  userId: string,
  limit = 50
): Promise<AuditEntry[]> {
  return getTable()
    .where("[userId+timestamp]")
    .between([userId, Dexie.minKey], [userId, Dexie.maxKey], true, true)
    .reverse()
    .limit(limit)
    .toArray();
}

async function listByEntity(
  userId: string,
  entity: AuditEntry["entity"],
  entityId: string
): Promise<AuditEntry[]> {
  return getTable()
    .where("userId")
    .equals(userId)
    .and((entry) => entry.entity === entity && entry.entityId === entityId)
    .toArray();
}

async function deleteByUser(userId: string): Promise<void> {
  await getTable().where("userId").equals(userId).delete();
}

export const auditRepository = {
  addEntry,
  listByUser,
  listByEntity,
  deleteByUser,
};
