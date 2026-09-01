import Dexie from "dexie";
import { getDatabase } from "../database";
import {
  decryptSensitiveFields,
  encryptSensitiveFields,
} from "../crypto-field";
import type { EncryptedPayload } from "../../crypto/crypto.types";
import type { Meal, MealType } from "../types";

export type MealFilter = {
  from?: string;
  to?: string;
  type?: MealType;
};

/**
 * Persisted shape: the sensitive free-text fields (`description`, `notes`) are
 * encrypted at rest; the fields used by the compound query indexes stay plain.
 */
type StoredMeal = Omit<Meal, "description" | "notes"> & {
  description?: string | EncryptedPayload;
  notes?: string | EncryptedPayload;
};

function getTable(): Dexie.Table<StoredMeal, string> {
  return getDatabase().meals as Dexie.Table<StoredMeal, string>;
}

async function encryptRecord(record: Meal): Promise<StoredMeal> {
  const { fields, encrypted: didEncrypt } = await encryptSensitiveFields({
    description: record.description,
    notes: record.notes,
  });
  const stored: StoredMeal = {
    ...record,
    ...(didEncrypt
      ? {
          description:
            (fields.description as string | EncryptedPayload | undefined) ?? "",
          notes: (fields.notes as string | EncryptedPayload | undefined) ?? undefined,
        }
      : { description: record.description, notes: record.notes }),
  };
  return stored;
}

async function decryptRecord(stored: StoredMeal): Promise<Meal> {
  const out = await decryptSensitiveFields({
    description: stored.description,
    notes: stored.notes,
  });
  const description =
    typeof out.description === "string" ? out.description : "";
  const notes = typeof out.notes === "string" ? out.notes : undefined;
  return { ...stored, description, notes };
}

async function create(
  data: Omit<Meal, "id" | "createdAt" | "updatedAt">
): Promise<Meal> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: Meal = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await getTable().add(await encryptRecord(record));
  return record;
}

async function findById(id: string): Promise<Meal | undefined> {
  const stored = await getTable().get(id);
  return stored ? decryptRecord(stored) : undefined;
}

/**
 * Lists meals for a single user, ordered newest first, scoped to the user via
 * the `[userId+consumedAt]` compound index.
 */
async function findByUser(
  userId: string,
  filter: MealFilter = {}
): Promise<Meal[]> {
  const from = filter.from ?? Dexie.minKey;
  const to = filter.to ?? Dexie.maxKey;
  const records = await getTable()
    .where("[userId+consumedAt]")
    .between([userId, from], [userId, to], true, true)
    .toArray();

  const scoped = records.filter(
    (record) => !filter.type || record.type === filter.type
  );
  const decrypted = await Promise.all(scoped.map(decryptRecord));
  return decrypted.reverse();
}

async function findRecentByUser(userId: string, limit = 5): Promise<Meal[]> {
  const records = await findByUser(userId);
  return records.slice(0, limit);
}

async function countByUser(userId: string): Promise<number> {
  return getTable().where("userId").equals(userId).count();
}

async function update(
  id: string,
  data: Partial<Pick<Meal, "type" | "description" | "consumedAt" | "notes">>
): Promise<Meal | undefined> {
  const existing = await getTable().get(id);
  if (!existing) return undefined;

  const updated: StoredMeal = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const { fields: encrypted } = await encryptSensitiveFields({
    description: updated.description,
    notes: updated.notes,
  });
  updated.description =
    (encrypted.description as string | EncryptedPayload | undefined) ?? "";
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

export const mealRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};