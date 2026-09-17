import { getDatabase } from "../db/database";
import { clearReminders } from "../browser/reminders/reminder.service";
import { recordAuditAsync } from "../audit";

/**
 * Deletes all health-data records for a single user across the five data
 * tables, the device registry, sync history, audit trail and the user's
 * sessions (which logs them out). Everything runs in a single Dexie
 * transaction, so no partial deletion can occur.
 *
 * Reminders kept in localStorage are cleared separately afterwards, since
 * localStorage is not part of IndexedDB and cannot join the transaction.
 *
 * The user account row is preserved (registered users are kept for re-login),
 * but all session rows and all health data are removed.
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
      db.medications,
      db.devices,
      db.syncHistory,
      db.auditTrail,
      db.sessions,
    ],
    async () => {
      await Promise.all([
        db.glucoseReadings.where("userId").equals(userId).delete(),
        db.meals.where("userId").equals(userId).delete(),
        db.activities.where("userId").equals(userId).delete(),
        db.notes.where("userId").equals(userId).delete(),
        db.medications.where("userId").equals(userId).delete(),
        db.devices.where("userId").equals(userId).delete(),
        db.syncHistory.where("userId").equals(userId).delete(),
        db.auditTrail.where("userId").equals(userId).delete(),
        db.sessions.where("userId").equals(userId).delete(),
      ]);
    }
  );

  clearReminders();
  recordAuditAsync("user.data.deleted", "user", userId);
}
