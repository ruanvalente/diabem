import Dexie from "dexie";
import { getDatabase } from "../database";
import type { GlucoseContext, GlucoseReading } from "../types";

export type GlucoseReadingFilter = {
  from?: string;
  to?: string;
  context?: GlucoseContext;
};

function getTable() {
  return getDatabase().glucoseReadings;
}

async function create(
  data: Omit<GlucoseReading, "id" | "createdAt" | "updatedAt">
): Promise<GlucoseReading> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const record: GlucoseReading = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await getTable().add(record);
  return record;
}

async function findById(id: string): Promise<GlucoseReading | undefined> {
  return getTable().get(id);
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

  return records
    .filter((record) => !filter.context || record.context === filter.context)
    .reverse();
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

  const updated: GlucoseReading = {
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

export const glucoseRepository = {
  create,
  findById,
  findByUser,
  findRecentByUser,
  countByUser,
  update,
  deleteById,
};