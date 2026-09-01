import Dexie from "dexie";
import { getDatabase } from "../database";
import {
  decryptSensitiveFields,
  encryptSensitiveFields,
} from "../crypto-field";
import type { EncryptedPayload } from "../../crypto/crypto.types";
import type { Note } from "../types";

export type NoteFilter = {
  from?: string;
  to?: string;
};

/**
 * Persisted shape: the sensitive free-text field (`content`) is encrypted at
 * rest; the fields used by the compound query index stay plaintext.
 */
type StoredNote = Omit<Note, "content"> & {
  content?: string | EncryptedPayload;
};

function getTable(): Dexie.Table<StoredNote, string> {
  return getDatabase().notes as Dexie.Table<StoredNote, string>;
}

async function encryptRecord(record: Note): Promise<StoredNote> {
  const { fields, encrypted: didEncrypt } = await encryptSensitiveFields({
    content: record.content,
  });
  const stored: StoredNote = {
    ...record,
    content: didEncrypt
      ? (fields.content as string | EncryptedPayload | undefined) ?? ""
      : record.content,
  };
  return stored;
}

async function decryptRecord(stored: StoredNote): Promise<Note> {
  const out = await decryptSensitiveFields({ content: stored.content });
  const content = typeof out.content === "string" ? out.content : "";
  return { ...stored, content };
}

async function create(
  data: Omit<Note, "id" | "createdAt" | "updatedAt">
): Promise<Note> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: Note = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await getTable().add(await encryptRecord(record));
  return record;
}

async function findById(id: string): Promise<Note | undefined> {
  const stored = await getTable().get(id);
  return stored ? decryptRecord(stored) : undefined;
}

/**
 * Lists notes for a single user, ordered newest first, scoped to the user via
 * the `[userId+createdAt]` compound index.
 */
async function findByUser(
  userId: string,
  filter: NoteFilter = {}
): Promise<Note[]> {
  const from = filter.from ?? Dexie.minKey;
  const to = filter.to ?? Dexie.maxKey;
  const records = await getTable()
    .where("[userId+createdAt]")
    .between([userId, from], [userId, to], true, true)
    .toArray();

  const decrypted = await Promise.all(records.map(decryptRecord));
  return decrypted.reverse();
}

async function findRecentByUser(userId: string, limit = 5): Promise<Note[]> {
  const records = await findByUser(userId);
  return records.slice(0, limit);
}

async function countByUser(userId: string): Promise<number> {
  return getTable().where("userId").equals(userId).count();
}

async function update(
  id: string,
  data: Partial<Pick<Note, "content">>
): Promise<Note | undefined> {
  const existing = await getTable().get(id);
  if (!existing) return undefined;

  const updated: StoredNote = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  const { fields: encrypted } = await encryptSensitiveFields({
    content: updated.content,
  });
  updated.content =
    (encrypted.content as string | EncryptedPayload | undefined) ?? "";

  await getTable().put(updated);
  return decryptRecord(updated);
}

async function deleteById(id: string): Promise<boolean> {
  const existing = await getTable().get(id);
  if (!existing) return false;
  await getTable().delete(id);
  return true;
}

export const noteRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};