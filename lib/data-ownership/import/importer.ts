import Dexie from "dexie";
import { getDatabase } from "../../db/database";
import { glucoseRepository } from "../../db/repositories/glucose.repository";
import { mealRepository } from "../../db/repositories/meal.repository";
import { activityRepository } from "../../db/repositories/activity.repository";
import { noteRepository } from "../../db/repositories/note.repository";
import { encryptSensitiveFields } from "../../db/crypto-field";
import type {
  ActivityType,
  GlucoseContext,
  MealType,
} from "../../db/types";
import type { EncryptedPayload } from "../../crypto/crypto.types";
import type { DiaBemExport } from "../types/export.types";
import type {
  ImportFileKind,
  ImportPreview,
  ImportResult,
  ImportValidationError,
  NormalizedImportData,
} from "../types/import.types";
import { parseJsonImport } from "./json-parser";
import { parseCsvImport } from "./csv-parser";
import { normalizeImportData } from "./normalizer";
import {
  deduplicateGlucose,
  deduplicateMeals,
  deduplicateActivities,
  deduplicateNotes,
} from "./deduplicator";

/**
 * Reads a File object and returns its text content.
 */
export async function readFileContent(file: File): Promise<string> {
  return file.text();
}

/**
 * Parses raw file content based on detected kind.
 * Returns normalized data and validation errors.
 */
export function parseFileContent(
  content: string,
  fileKind: ImportFileKind
): { data: NormalizedImportData; errors: ImportValidationError[] } {
  if (fileKind === "json") {
    const result = parseJsonImport(content);
    if (!result.ok) {
      return { data: { glucose: [], meals: [], activities: [], notes: [] }, errors: result.errors };
    }
    return normalizeFromExport(result.data);
  }

  if (fileKind === "csv") {
    const result = parseCsvImport(content);
    if (!result.ok) {
      return { data: { glucose: [], meals: [], activities: [], notes: [] }, errors: result.errors };
    }
    return { data: normalizeImportData(result.data), errors: result.errors };
  }

  return {
    data: { glucose: [], meals: [], activities: [], notes: [] },
    errors: [{ recordIndex: -1, field: "file", message: "Formato de arquivo não reconhecido." }],
  };
}

/**
 * Converts a DiaBemExport envelope to normalized import data.
 * Strips IDs — new IDs will be generated on import.
 * Preserves timestamps for deduplication.
 */
function normalizeFromExport(
  exportData: DiaBemExport
): { data: NormalizedImportData; errors: ImportValidationError[] } {
  const { data } = exportData;

  return {
    data: {
      glucose: (data.glucose ?? []).map((r) => ({
        value: r.value,
        unit: r.unit,
        context: r.context,
        measuredAt: r.measuredAt,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      meals: (data.meals ?? []).map((r) => ({
        type: r.type,
        description: r.description,
        consumedAt: r.consumedAt,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      activities: (data.activities ?? []).map((r) => ({
        type: r.type,
        durationMinutes: r.durationMinutes,
        startedAt: r.startedAt,
        notes: r.notes,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      notes: (data.notes ?? []).map((r) => ({
        content: r.content,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    },
    errors: [],
  };
}

/**
 * Builds an import preview with deduplication counts.
 */
export async function buildImportPreview(
  userId: string,
  fileName: string,
  fileKind: ImportFileKind,
  normalizedData: NormalizedImportData
): Promise<ImportPreview> {
  // Load existing records for deduplication check
  const [existingGlucose, existingMeals, existingActivities, existingNotes] =
    await Promise.all([
      glucoseRepository.findByUser(userId),
      mealRepository.findByUser(userId),
      activityRepository.findByUser(userId),
      noteRepository.findByUser(userId),
    ]);

  const glucoseDedup = deduplicateGlucose(normalizedData.glucose, existingGlucose);
  const mealsDedup = deduplicateMeals(normalizedData.meals, existingMeals);
  const activitiesDedup = deduplicateActivities(normalizedData.activities, existingActivities);
  const notesDedup = deduplicateNotes(normalizedData.notes, existingNotes);

  const duplicateCount =
    glucoseDedup.duplicateCount +
    mealsDedup.duplicateCount +
    activitiesDedup.duplicateCount +
    notesDedup.duplicateCount;

  const errorCount = normalizedData.glucose.length + normalizedData.meals.length +
    normalizedData.activities.length + normalizedData.notes.length -
    (glucoseDedup.unique.length + mealsDedup.unique.length +
      activitiesDedup.unique.length + notesDedup.unique.length) - duplicateCount;

  return {
    fileName,
    fileKind,
    glucoseCount: normalizedData.glucose.length,
    mealsCount: normalizedData.meals.length,
    activitiesCount: normalizedData.activities.length,
    notesCount: normalizedData.notes.length,
    totalRecords:
      normalizedData.glucose.length +
      normalizedData.meals.length +
      normalizedData.activities.length +
      normalizedData.notes.length,
    duplicateCount,
    errorCount: Math.max(0, errorCount),
    errors: [],
  };
}

/**
 * Executes the import within a transaction.
 * Only imports unique records (deduplication already applied).
 *
 * IMPORTANT: All encryption is done BEFORE the transaction to avoid
 * PrematureCommitError in fake-indexeddb, which auto-commits transactions
 * when there are no pending IDB requests and the code yields via await.
 */
export async function executeImport(
  userId: string,
  normalizedData: NormalizedImportData
): Promise<ImportResult> {
  const db = getDatabase();
  const errors: ImportValidationError[] = [];

  // Step 1: Read existing records OUTSIDE the transaction
  const [curGlucose, curMeals, curActivities, curNotes] = await Promise.all([
    glucoseRepository.findByUser(userId),
    mealRepository.findByUser(userId),
    activityRepository.findByUser(userId),
    noteRepository.findByUser(userId),
  ]);

  const glucoseDedup = deduplicateGlucose(normalizedData.glucose, curGlucose);
  const mealsDedup = deduplicateMeals(normalizedData.meals, curMeals);
  const activitiesDedup = deduplicateActivities(normalizedData.activities, curActivities);
  const notesDedup = deduplicateNotes(normalizedData.notes, curNotes);

  // Step 2: Pre-encrypt ALL records BEFORE opening the transaction
  const glucoseRecords: Array<{ id: string; userId: string; value: number; unit: "mg/dL"; context: GlucoseContext; measuredAt: string; createdAt: string; updatedAt: string; notes?: string | EncryptedPayload }> = [];
  for (const record of glucoseDedup.unique) {
    const { fields, encrypted } = await encryptSensitiveFields({ notes: record.notes });
    glucoseRecords.push({
      id: crypto.randomUUID(),
      userId,
      value: record.value,
      unit: "mg/dL",
      context: record.context as GlucoseContext,
      measuredAt: record.measuredAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      notes: encrypted
        ? (fields.notes as string | EncryptedPayload | undefined) ?? undefined
        : record.notes,
    });
  }

  const mealRecords: Array<{ id: string; userId: string; type: MealType; description: string | EncryptedPayload; consumedAt: string; createdAt: string; updatedAt: string; notes?: string | EncryptedPayload }> = [];
  for (const record of mealsDedup.unique) {
    const { fields, encrypted } = await encryptSensitiveFields({
      description: record.description,
      notes: record.notes,
    });
    mealRecords.push({
      id: crypto.randomUUID(),
      userId,
      type: record.type as MealType,
      description: encrypted
        ? (fields.description as string | EncryptedPayload) ?? ""
        : record.description,
      consumedAt: record.consumedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      notes: encrypted
        ? (fields.notes as string | EncryptedPayload | undefined) ?? undefined
        : record.notes,
    });
  }

  const activityRecords: Array<{ id: string; userId: string; type: ActivityType; durationMinutes: number; startedAt: string; createdAt: string; updatedAt: string; notes?: string | EncryptedPayload }> = [];
  for (const record of activitiesDedup.unique) {
    const { fields, encrypted } = await encryptSensitiveFields({ notes: record.notes });
    activityRecords.push({
      id: crypto.randomUUID(),
      userId,
      type: record.type as ActivityType,
      durationMinutes: record.durationMinutes,
      startedAt: record.startedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      notes: encrypted
        ? (fields.notes as string | EncryptedPayload | undefined) ?? undefined
        : record.notes,
    });
  }

  const noteRecords: Array<{ id: string; userId: string; content: string | EncryptedPayload; createdAt: string; updatedAt: string }> = [];
  for (const record of notesDedup.unique) {
    const { fields, encrypted } = await encryptSensitiveFields({ content: record.content });
    noteRecords.push({
      id: crypto.randomUUID(),
      userId,
      content: encrypted
        ? (fields.content as string | EncryptedPayload) ?? ""
        : record.content,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  let glucoseImported = 0;
  let mealsImported = 0;
  let activitiesImported = 0;
  let notesImported = 0;

  // Step 3: Transaction contains ONLY synchronous .add() calls — no await
  // before the first request, preventing fake-indexeddb premature commit.
  await db.transaction(
    "rw",
    [db.glucoseReadings, db.meals, db.activities, db.notes],
    async () => {
      const glucoseTable = db.glucoseReadings as unknown as Dexie.Table<
        { id: string; userId: string; value: number; unit: "mg/dL"; context: GlucoseContext; measuredAt: string; createdAt: string; updatedAt: string; notes?: string | EncryptedPayload },
        string
      >;
      const mealTable = db.meals as unknown as Dexie.Table<
        { id: string; userId: string; type: MealType; description: string | EncryptedPayload; consumedAt: string; createdAt: string; updatedAt: string; notes?: string | EncryptedPayload },
        string
      >;
      const activityTable = db.activities as unknown as Dexie.Table<
        { id: string; userId: string; type: ActivityType; durationMinutes: number; startedAt: string; createdAt: string; updatedAt: string; notes?: string | EncryptedPayload },
        string
      >;
      const noteTable = db.notes as unknown as Dexie.Table<
        { id: string; userId: string; content: string | EncryptedPayload; createdAt: string; updatedAt: string },
        string
      >;

      for (const record of glucoseRecords) {
        try {
          await glucoseTable.add(record);
          glucoseImported++;
        } catch {
          errors.push({
            recordIndex: glucoseImported + 1,
            field: "glucose",
            message: "Erro ao importar registro de glicemia.",
          });
        }
      }

      for (const record of mealRecords) {
        try {
          await mealTable.add(record);
          mealsImported++;
        } catch {
          errors.push({
            recordIndex: mealsImported + 1,
            field: "meal",
            message: "Erro ao importar registro de refeição.",
          });
        }
      }

      for (const record of activityRecords) {
        try {
          await activityTable.add(record);
          activitiesImported++;
        } catch {
          errors.push({
            recordIndex: activitiesImported + 1,
            field: "activity",
            message: "Erro ao importar registro de atividade.",
          });
        }
      }

      for (const record of noteRecords) {
        try {
          await noteTable.add(record);
          notesImported++;
        } catch {
          errors.push({
            recordIndex: notesImported + 1,
            field: "note",
            message: "Erro ao importar observação.",
          });
        }
      }
    }
  );

  return {
    glucoseImported,
    mealsImported,
    activitiesImported,
    notesImported,
    totalImported:
      glucoseImported + mealsImported + activitiesImported + notesImported,
    duplicatesSkipped:
      glucoseDedup.duplicateCount +
      mealsDedup.duplicateCount +
      activitiesDedup.duplicateCount +
      notesDedup.duplicateCount,
    errors,
  };
}
