import { getDatabase } from "../db/database";

/**
 * Deletes all health-data records for a single user across the four tables,
 * plus the device registry and sync history owned by that user (Sprint 9 —
 * Data Ownership integration).
 *
 * Runs in a single Dexie transaction so no partial deletion can occur.
 *
 * The user account and session are intentionally preserved.
 */
export async function deleteUserHealthData(userId: string): Promise<void> {
  const db = getDatabase();

  await db.transaction(
    "rw",
    [
      db.glucoseReadings,
      db.meals,
      db.activities,
      db.notes,
      db.devices,
      db.syncHistory,
    ],
    async () => {
      await Promise.all([
        db.glucoseReadings.where("userId").equals(userId).delete(),
        db.meals.where("userId").equals(userId).delete(),
        db.activities.where("userId").equals(userId).delete(),
        db.notes.where("userId").equals(userId).delete(),
        db.devices.where("userId").equals(userId).delete(),
        db.syncHistory.where("userId").equals(userId).delete(),
      ]);
    }
  );
}
