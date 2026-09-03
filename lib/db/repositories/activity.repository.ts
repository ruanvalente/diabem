import Dexie from "dexie";
import { getDatabase } from "../database";
import {
  decryptSensitiveFields,
  encryptSensitiveFields,
} from "../crypto-field";
import type { EncryptedPayload } from "../../crypto/crypto.types";
import type { Activity, ActivityType } from "../types";

export type ActivityFilter = {
  from?: string;
  to?: string;
  type?: ActivityType;
};

/**
 * Persisted shape: the sensitive free-text field (`notes`) is encrypted at
 * rest; the fields used by the compound query indexes stay plaintext.
 */
type StoredActivity = Omit<Activity, "notes"> & {
  notes?: string | EncryptedPayload;
};

function getTable(): Dexie.Table<StoredActivity, string> {
  return getDatabase().activities as Dexie.Table<StoredActivity, string>;
}

async function encryptRecord(record: Activity): Promise<StoredActivity> {
  const { fields, encrypted: didEncrypt } = await encryptSensitiveFields({
    notes: record.notes,
  });
  const stored: StoredActivity = {
    ...record,
    notes: didEncrypt
      ? (fields.notes as string | EncryptedPayload | undefined) ?? undefined
      : record.notes,
  };
  return stored;
}

async function decryptRecord(stored: StoredActivity): Promise<Activity> {
  const out = await decryptSensitiveFields({ notes: stored.notes });
  const notes = typeof out.notes === "string" ? out.notes : undefined;
  return { ...stored, notes };
}

async function create(
  data: Omit<Activity, "id" | "createdAt" | "updatedAt">,
  timestamps?: { createdAt?: string; updatedAt?: string }
): Promise<Activity> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: Activity = {
    ...data,
    id,
    createdAt: timestamps?.createdAt ?? now,
    updatedAt: timestamps?.updatedAt ?? timestamps?.createdAt ?? now,
  };
  await getTable().add(await encryptRecord(record));
  return record;
}

async function findById(id: string): Promise<Activity | undefined> {
  const stored = await getTable().get(id);
  return stored ? decryptRecord(stored) : undefined;
}

/**
 * Lists activities for a single user, ordered newest first, scoped to the user
 * via the `[userId+startedAt]` compound index.
 */
async function findByUser(
  userId: string,
  filter: ActivityFilter = {}
): Promise<Activity[]> {
  const from = filter.from ?? Dexie.minKey;
  const to = filter.to ?? Dexie.maxKey;
  const records = await getTable()
    .where("[userId+startedAt]")
    .between([userId, from], [userId, to], true, true)
    .toArray();

  const scoped = records.filter(
    (record) => !filter.type || record.type === filter.type
  );
  const decrypted = await Promise.all(scoped.map(decryptRecord));
  return decrypted.reverse();
}

async function findRecentByUser(
  userId: string,
  limit = 5
): Promise<Activity[]> {
  const records = await findByUser(userId);
  return records.slice(0, limit);
}

async function countByUser(userId: string): Promise<number> {
  return getTable().where("userId").equals(userId).count();
}

async function update(
  id: string,
  data: Partial<
    Pick<Activity, "type" | "durationMinutes" | "startedAt" | "notes">
  >
): Promise<Activity | undefined> {
  const existing = await getTable().get(id);
  if (!existing) return undefined;

  const updated: StoredActivity = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const { fields: encrypted } = await encryptSensitiveFields({
    notes: updated.notes,
  });
  updated.notes =
    (encrypted.notes as string | EncryptedPayload | undefined) ?? undefined;

  await getTable().put(updated);
  return decryptRecord(updated);
}

async function deleteById(id: string): Promise<boolean> {
  const existing = await getTable().get(id);
  if (!existing) return false;
  await getTable().delete(id);
  return true;
}

export const activityRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};