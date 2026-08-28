import Dexie from "dexie";
import { getDatabase } from "../database";
import type { Activity, ActivityType } from "../types";

export type ActivityFilter = {
  from?: string;
  to?: string;
  type?: ActivityType;
};

function getTable() {
  return getDatabase().activities;
}

async function create(
  data: Omit<Activity, "id" | "createdAt" | "updatedAt">
): Promise<Activity> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: Activity = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await getTable().add(record);
  return record;
}

async function findById(id: string): Promise<Activity | undefined> {
  return getTable().get(id);
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

  return records
    .filter((record) => !filter.type || record.type === filter.type)
    .reverse();
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

  const updated: Activity = {
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

export const activityRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};