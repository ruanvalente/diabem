import Dexie from "dexie";
import { getDatabase } from "../database";
import type { Note } from "../types";

export type NoteFilter = {
  from?: string;
  to?: string;
};

function getTable() {
  return getDatabase().notes;
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
  await getTable().add(record);
  return record;
}

async function findById(id: string): Promise<Note | undefined> {
  return getTable().get(id);
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

  return records.reverse();
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

  const updated: Note = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await getTable().put(updated);
  return updated;
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