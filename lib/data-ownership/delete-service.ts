import { getDatabase } from "../db/database";

/**
 * Deletes all health-data records for a single user across the four tables.
 * Runs in a single Dexie transaction so no partial deletion can occur.
 *
 * The user account and session are intentionally preserved.
 */
export async function deleteUserHealthData(userId: string): Promise<void> {
  const db = getDatabase();

  await db.transaction(
    "rw",
    [db.glucoseReadings, db.meals, db.activities, db.notes],
    async () => {
      await Promise.all([
        db.glucoseReadings.where("userId").equals(userId).delete(),
        db.meals.where("userId").equals(userId).delete(),
        db.activities.where("userId").equals(userId).delete(),
        db.notes.where("userId").equals(userId).delete(),
      ]);
    }
  );
}
