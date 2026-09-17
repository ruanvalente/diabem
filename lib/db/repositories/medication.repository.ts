import Dexie from "dexie";
import { getDatabase } from "../database";
import {
  decryptSensitiveFields,
  encryptSensitiveFields,
} from "../crypto-field";
import type { EncryptedPayload } from "../../crypto/crypto.types";
import type { Medication } from "../types";

export type MedicationFilter = {
  from?: string;
  to?: string;
};

/**
 * Persisted shape: the sensitive free-text field (`notes`) is encrypted at
 * rest; the fields used by the compound query index stay plaintext.
 */
type StoredMedication = Omit<Medication, "notes"> & {
  notes?: string | EncryptedPayload;
};

function getTable(): Dexie.Table<StoredMedication, string> {
  return getDatabase().medications as Dexie.Table<StoredMedication, string>;
}

async function encryptRecord(record: Medication): Promise<StoredMedication> {
  const { fields, encrypted: didEncrypt } = await encryptSensitiveFields({
    notes: record.notes,
  });
  const stored: StoredMedication = {
    ...record,
    notes: didEncrypt
      ? (fields.notes as string | EncryptedPayload | undefined) ?? undefined
      : record.notes,
  };
  return stored;
}

async function decryptRecord(stored: StoredMedication): Promise<Medication> {
  const out = await decryptSensitiveFields({ notes: stored.notes });
  const notes = typeof out.notes === "string" ? out.notes : undefined;
  return { ...stored, notes };
}

async function create(
  data: Omit<Medication, "id" | "createdAt" | "updatedAt">,
  timestamps?: { createdAt?: string; updatedAt?: string }
): Promise<Medication> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: Medication = {
    ...data,
    id,
    createdAt: timestamps?.createdAt ?? now,
    updatedAt: timestamps?.updatedAt ?? timestamps?.createdAt ?? now,
  };
  await getTable().add(await encryptRecord(record));
  return record;
}

async function findById(id: string): Promise<Medication | undefined> {
  const stored = await getTable().get(id);
  return stored ? decryptRecord(stored) : undefined;
}

/**
 * Lists medications for a single user, ordered newest first. Bounds are
 * optional ISO timestamps; sharing an array with `userId` on the
 * `[userId+medicatedAt]` index keeps the query scoped to the current user.
 */
async function findByUser(
  userId: string,
  filter: MedicationFilter = {}
): Promise<Medication[]> {
  const from = filter.from ?? Dexie.minKey;
  const to = filter.to ?? Dexie.maxKey;
  const records = await getTable()
    .where("[userId+medicatedAt]")
    .between([userId, from], [userId, to], true, true)
    .toArray();

  const decrypted = await Promise.all(records.map(decryptRecord));
  return decrypted.reverse();
}

async function findRecentByUser(
  userId: string,
  limit = 5
): Promise<Medication[]> {
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
      Medication,
      | "name"
      | "dosage"
      | "unit"
      | "frequency"
      | "route"
      | "medicatedAt"
      | "notes"
    >
  >
): Promise<Medication | undefined> {
  const existing = await getTable().get(id);
  if (!existing) return undefined;

  const updated: StoredMedication = {
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

export const medicationRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};