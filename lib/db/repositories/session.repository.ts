import { getDatabase } from "../database";
import type { LocalSession } from "../types";

function getTable() {
  return getDatabase().sessions;
}

async function create(
  data: Omit<LocalSession, "id" | "createdAt">
): Promise<LocalSession> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const session: LocalSession = {
    ...data,
    id,
    createdAt: now,
  };
  await getTable().add(session);
  return session;
}

async function getCurrent(): Promise<LocalSession | undefined> {
  const current = await getTable().orderBy("createdAt").last();
  if (!current) return undefined;

  if (current.expiresAt && new Date(current.expiresAt) < new Date()) {
    await getTable().delete(current.id);
    return undefined;
  }

  return current;
}

async function deleteById(id: string): Promise<boolean> {
  const deleted = await getTable().delete(id);
  return deleted === undefined;
}

async function deleteAll(): Promise<void> {
  await getTable().clear();
}

export const sessionRepository = {
  create,
  getCurrent,
  deleteById,
  deleteAll,
};
