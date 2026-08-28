import Dexie from "dexie";
import { getDatabase } from "../database";
import type { Meal, MealType } from "../types";

export type MealFilter = {
  from?: string;
  to?: string;
  type?: MealType;
};

function getTable() {
  return getDatabase().meals;
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
  await getTable().add(record);
  return record;
}

async function findById(id: string): Promise<Meal | undefined> {
  return getTable().get(id);
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

  return records
    .filter((record) => !filter.type || record.type === filter.type)
    .reverse();
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

  const updated: Meal = {
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

export const mealRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};