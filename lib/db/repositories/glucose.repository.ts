import Dexie from "dexie";
import { getDatabase } from "../database";
import {
  decryptSensitiveFields,
  encryptSensitiveFields,
} from "../crypto-field";
import type { EncryptedPayload } from "../../crypto/crypto.types";
import type { GlucoseContext, GlucoseReading } from "../types";

export type GlucoseReadingFilter = {
  from?: string;
  to?: string;
  context?: GlucoseContext;
};

/**
 * Persisted shape: the sensitive free-text field (`notes`) is encrypted at
 * rest; the fields used by the compound query indexes stay plaintext.
 */
type StoredGlucoseReading = Omit<GlucoseReading, "notes"> & {
  notes?: string | EncryptedPayload;
};

function getTable(): Dexie.Table<StoredGlucoseReading, string> {
  return getDatabase().glucoseReadings as Dexie.Table<StoredGlucoseReading, string>;
}

async function encryptRecord(
  record: GlucoseReading
): Promise<StoredGlucoseReading> {
  const { fields, encrypted: didEncrypt } = await encryptSensitiveFields({
    notes: record.notes,
  });
  const stored: StoredGlucoseReading = {
    ...record,
    notes: didEncrypt
      ? (fields.notes as string | EncryptedPayload | undefined) ?? undefined
      : record.notes,
  };
  return stored;
}

async function decryptRecord(
  stored: StoredGlucoseReading
): Promise<GlucoseReading> {
  const out = await decryptSensitiveFields({
    notes: stored.notes,
  });
  const notes = typeof out.notes === "string" ? out.notes : undefined;
  return { ...stored, notes };
}

async function create(
  data: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt">,
  timestamps?: { createdAt?: string; updatedAt?: string }
): Promise<GlucoseReading> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: GlucoseReading = {
    ...data,
    id,
    createdAt: timestamps?.createdAt ?? now,
    updatedAt: timestamps?.updatedAt ?? timestamps?.createdAt ?? now,
  };
  await getTable().add(await encryptRecord(record));
  return record;
}

async function findById(id: string): Promise<GlucoseReading | undefined> {
  const stored = await getTable().get(id);
  return stored ? decryptRecord(stored) : undefined;
}

/**
 * Lists readings for a single user, ordered newest first. Bounds are optional
 * ISO timestamps; sharing an array with `userId` on the `[userId+measuredAt]`
 * index keeps the query scoped to the authenticated user.
 */
async function findByUser(
  userId: string,
  filter: GlucoseReadingFilter = {}
): Promise<GlucoseReading[]> {
  const from = filter.from ?? Dexie.minKey;
  const to = filter.to ?? Dexie.maxKey;
  const records = await getTable()
    .where("[userId+measuredAt]")
    .between([userId, from], [userId, to], true, true)
    .toArray();

  const scoped = records.filter(
    (record) => !filter.context || record.context === filter.context
  );
  const decrypted = await Promise.all(scoped.map(decryptRecord));
  return decrypted.reverse();
}

async function findRecentByUser(
  userId: string,
  limit = 5
): Promise<GlucoseReading[]> {
  const records = await findByUser(userId);
  return records.slice(0, limit);
}

async function countByUser(userId: string): Promise<number> {
  return getTable().where("userId").equals(userId).count();
}

async function update(
  id: string,
  data: Partial<
    Pick<
      GlucoseReading,
      "value" | "unit" | "context" | "measuredAt" | "notes"
    >
  >
): Promise<GlucoseReading | undefined> {
  const existing = await getTable().get(id);
  if (!existing) return undefined;

  const updated: StoredGlucoseReading = {
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

export const glucoseRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};