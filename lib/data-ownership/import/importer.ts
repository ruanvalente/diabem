import Dexie from "dexie";
import { getDatabase } from "../../db/database";
import { glucoseRepository } from "../../db/repositories/glucose.repository";
import { mealRepository } from "../../db/repositories/meal.repository";
import { activityRepository } from "../../db/repositories/activity.repository";
import { noteRepository } from "../../db/repositories/note.repository";
import { medicationRepository } from "../../db/repositories/medication.repository";
import {
  encryptSensitiveFields,
  type SensitiveFields,
} from "../../db/crypto-field";
import type {
  ActivityType,
  DataProvenance,
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
  deduplicateMedications,
} from "./deduplicator";
import { recordAuditAsync } from "../../audit";

/** Shared context for every record built during an import. */
type ImportMeta = {
  userId: string;
  importedAt: string;
  sourceId?: string;
};

// Persisted shapes used by the import pipeline. Sensitive fields may be
// written back as ciphertext, hence the `string | EncryptedPayload` unions
// that differ from the plain domain types (which is why the table casts
// below are needed).
type ImportGlucoseRecord = {
  id: string;
  userId: string;
  value: number;
  unit: "mg/dL";
  context: GlucoseContext;
  measuredAt: string;
  createdAt: string;
  updatedAt: string;
  provenance?: DataProvenance;
  notes?: string | EncryptedPayload;
};

type ImportMealRecord = {
  id: string;
  userId: string;
  type: MealType;
  description: string | EncryptedPayload;
  consumedAt: string;
  createdAt: string;
  updatedAt: string;
  provenance?: DataProvenance;
  notes?: string | EncryptedPayload;
};

type ImportActivityRecord = {
  id: string;
  userId: string;
  type: ActivityType;
  durationMinutes: number;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  provenance?: DataProvenance;
  notes?: string | EncryptedPayload;
};

type ImportNoteRecord = {
  id: string;
  userId: string;
  content: string | EncryptedPayload;
  createdAt: string;
  updatedAt: string;
  provenance?: DataProvenance;
};

type ImportMedicationRecord = {
  id: string;
  userId: string;
  name: string;
  dosage?: string;
  unit?: string;
  frequency?: string;
  route?: string;
  medicatedAt: string;
  createdAt: string;
  updatedAt: string;
  provenance?: DataProvenance;
  notes?: string | EncryptedPayload;
};

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
  const emptyData: NormalizedImportData = {
    glucose: [],
    meals: [],
    activities: [],
    notes: [],
    medications: [],
  };

  if (fileKind === "json") {
    const result = parseJsonImport(content);
    if (!result.ok) {
      return { data: emptyData, errors: result.errors };
    }
    return normalizeFromExport(result.data);
  }

  if (fileKind === "csv") {
    const result = parseCsvImport(content);
    if (!result.ok) {
      return { data: emptyData, errors: result.errors };
    }
    return { data: normalizeImportData(result.data), errors: result.errors };
  }

  return {
    data: emptyData,
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
        sourceKey: r.sourceKey,
        provenance: r.provenance,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      meals: (data.meals ?? []).map((r) => ({
        type: r.type,
        description: r.description,
        consumedAt: r.consumedAt,
        notes: r.notes,
        provenance: r.provenance,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      activities: (data.activities ?? []).map((r) => ({
        type: r.type,
        durationMinutes: r.durationMinutes,
        startedAt: r.startedAt,
        notes: r.notes,
        provenance: r.provenance,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      notes: (data.notes ?? []).map((r) => ({
        content: r.content,
        provenance: r.provenance,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      medications: (data.medications ?? []).map((r) => ({
        name: r.name,
        dosage: r.dosage,
        unit: r.unit,
        frequency: r.frequency,
        route: r.route,
        medicatedAt: r.medicatedAt,
        notes: r.notes,
        provenance: r.provenance,
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
  const [existingGlucose, existingMeals, existingActivities, existingNotes, existingMedications] =
    await Promise.all([
      glucoseRepository.findByUser(userId),
      mealRepository.findByUser(userId),
      activityRepository.findByUser(userId),
      noteRepository.findByUser(userId),
      medicationRepository.findByUser(userId),
    ]);

  const glucoseDedup = deduplicateGlucose(normalizedData.glucose, existingGlucose);
  const mealsDedup = deduplicateMeals(normalizedData.meals, existingMeals);
  const activitiesDedup = deduplicateActivities(normalizedData.activities, existingActivities);
  const notesDedup = deduplicateNotes(normalizedData.notes, existingNotes);
  const medicationsDedup = deduplicateMedications(normalizedData.medications, existingMedications);

  const duplicateCount =
    glucoseDedup.duplicateCount +
    mealsDedup.duplicateCount +
    activitiesDedup.duplicateCount +
    notesDedup.duplicateCount +
    medicationsDedup.duplicateCount;

  const errorCount = normalizedData.glucose.length + normalizedData.meals.length +
    normalizedData.activities.length + normalizedData.notes.length +
    normalizedData.medications.length -
    (glucoseDedup.unique.length + mealsDedup.unique.length +
      activitiesDedup.unique.length + notesDedup.unique.length +
      medicationsDedup.unique.length) - duplicateCount;

  return {
    fileName,
    fileKind,
    glucoseCount: normalizedData.glucose.length,
    mealsCount: normalizedData.meals.length,
    activitiesCount: normalizedData.activities.length,
    notesCount: normalizedData.notes.length,
    medicationsCount: normalizedData.medications.length,
    totalRecords:
      normalizedData.glucose.length +
      normalizedData.meals.length +
      normalizedData.activities.length +
      normalizedData.notes.length +
      normalizedData.medications.length,
    duplicateCount,
    errorCount: Math.max(0, errorCount),
    errors: [],
  };
}

/**
 * Adds already-built records to a Dexie table, returning how many succeeded
 * and collecting a single validation error per failed record. Shared by every
 * entity pipeline so failure handling stays consistent.
 */
async function addImportRecords<T extends { id: string }>(
  table: Dexie.Table<T, string>,
  records: T[],
  field: string,
  message: string,
  errors: ImportValidationError[]
): Promise<number> {
  let imported = 0;
  for (const record of records) {
    try {
      await table.add(record);
      imported++;
    } catch {
      errors.push({ recordIndex: imported + 1, field, message });
    }
  }
  return imported;
}

/**
 * Returns the provenance for an imported record: keeps an existing one
 * (e.g. re-imported exports) or stamps this import as the origin.
 */
function resolveImportProvenance(
  existing: DataProvenance | undefined,
  recordedAt: string,
  meta: ImportMeta,
): DataProvenance {
  return existing ?? {
    source: "import",
    sourceId: meta.sourceId,
    importedAt: meta.importedAt,
    recordedAt,
  };
}

/**
 * Builds the persisted records for one entity before the import transaction.
 *
 * All encryption happens here, outside the transaction: awaiting a promise
 * inside a Dexie transaction with no pending IDB requests auto-commits it
 * (PrematureCommitError under fake-indexeddb) once the code yields via await.
 */
async function buildImportRecords<TDb extends { id: string }, TRaw>(
  rawRecords: TRaw[],
  encrypt: (raw: TRaw) => SensitiveFields,
  toRecord: (raw: TRaw, encryptedFields: SensitiveFields, encrypted: boolean) => TDb,
): Promise<TDb[]> {
  const records: TDb[] = [];
  for (const raw of rawRecords) {
    const { fields, encrypted } = await encryptSensitiveFields(encrypt(raw));
    records.push(toRecord(raw, fields, encrypted));
  }
  return records;
}

/**
 * Executes the import within a transaction.
 * Only imports unique records (deduplication already applied).
 *
 * Stamps `data.imported` provenance on fresh records; records that already
 * carry provenance (e.g. re-imported exports) keep their original origin.
 *
 * Records are built — and sensitive fields encrypted — before the transaction
 * starts (see `buildImportRecords`); only the plain `add` calls run inside it.
 */
export async function executeImport(
  userId: string,
  normalizedData: NormalizedImportData,
  importProvenance?: { sourceId?: string }
): Promise<ImportResult> {
  const db = getDatabase();
  const errors: ImportValidationError[] = [];
  const importMeta: ImportMeta = {
    userId,
    importedAt: new Date().toISOString(),
    sourceId: importProvenance?.sourceId,
  };

  const [curGlucose, curMeals, curActivities, curNotes, curMedications] = await Promise.all([
    glucoseRepository.findByUser(userId),
    mealRepository.findByUser(userId),
    activityRepository.findByUser(userId),
    noteRepository.findByUser(userId),
    medicationRepository.findByUser(userId),
  ]);

  const glucoseDedup = deduplicateGlucose(normalizedData.glucose, curGlucose);
  const mealsDedup = deduplicateMeals(normalizedData.meals, curMeals);
  const activitiesDedup = deduplicateActivities(normalizedData.activities, curActivities);
  const notesDedup = deduplicateNotes(normalizedData.notes, curNotes);
  const medicationsDedup = deduplicateMedications(normalizedData.medications, curMedications);

  const glucoseRecords = await buildImportRecords(
    glucoseDedup.unique,
    (r) => ({ notes: r.notes }),
    (r, fields, encrypted): ImportGlucoseRecord => ({
      id: crypto.randomUUID(),
      userId: importMeta.userId,
      value: r.value,
      unit: "mg/dL",
      context: r.context as GlucoseContext,
      measuredAt: r.measuredAt,
      provenance: resolveImportProvenance(r.provenance, r.measuredAt, importMeta),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      notes: encrypted ? fields.notes : r.notes,
    }),
  );

  const mealRecords = await buildImportRecords(
    mealsDedup.unique,
    (r) => ({ description: r.description, notes: r.notes }),
    (r, fields, encrypted): ImportMealRecord => ({
      id: crypto.randomUUID(),
      userId: importMeta.userId,
      type: r.type as MealType,
      description: encrypted ? fields.description ?? "" : r.description,
      consumedAt: r.consumedAt,
      provenance: resolveImportProvenance(r.provenance, r.consumedAt, importMeta),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      notes: encrypted ? fields.notes : r.notes,
    }),
  );

  const activityRecords = await buildImportRecords(
    activitiesDedup.unique,
    (r) => ({ notes: r.notes }),
    (r, fields, encrypted): ImportActivityRecord => ({
      id: crypto.randomUUID(),
      userId: importMeta.userId,
      type: r.type as ActivityType,
      durationMinutes: r.durationMinutes,
      startedAt: r.startedAt,
      provenance: resolveImportProvenance(r.provenance, r.startedAt, importMeta),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      notes: encrypted ? fields.notes : r.notes,
    }),
  );

  const noteRecords = await buildImportRecords(
    notesDedup.unique,
    (r) => ({ content: r.content }),
    (r, fields, encrypted): ImportNoteRecord => ({
      id: crypto.randomUUID(),
      userId: importMeta.userId,
      content: encrypted ? fields.content ?? "" : r.content,
      provenance: resolveImportProvenance(r.provenance, r.createdAt, importMeta),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }),
  );

  const medicationRecords = await buildImportRecords(
    medicationsDedup.unique,
    (r) => ({ notes: r.notes }),
    (r, fields, encrypted): ImportMedicationRecord => ({
      id: crypto.randomUUID(),
      userId: importMeta.userId,
      name: r.name,
      dosage: r.dosage,
      unit: r.unit,
      frequency: r.frequency,
      route: r.route,
      medicatedAt: r.medicatedAt,
      provenance: resolveImportProvenance(r.provenance, r.medicatedAt, importMeta),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      notes: encrypted ? fields.notes : r.notes,
    }),
  );

  let glucoseImported = 0;
  let mealsImported = 0;
  let activitiesImported = 0;
  let notesImported = 0;
  let medicationsImported = 0;

  await db.transaction(
    "rw",
    [db.glucoseReadings, db.meals, db.activities, db.notes, db.medications],
    async () => {
      const glucoseTable = db.glucoseReadings as unknown as Dexie.Table<
        ImportGlucoseRecord,
        string
      >;
      const mealTable = db.meals as unknown as Dexie.Table<
        ImportMealRecord,
        string
      >;
      const activityTable = db.activities as unknown as Dexie.Table<
        ImportActivityRecord,
        string
      >;
      const noteTable = db.notes as unknown as Dexie.Table<
        ImportNoteRecord,
        string
      >;
      const medicationTable = db.medications as unknown as Dexie.Table<
        ImportMedicationRecord,
        string
      >;

      glucoseImported = await addImportRecords(
        glucoseTable,
        glucoseRecords,
        "glucose",
        "Erro ao importar registro de glicemia.",
        errors
      );
      mealsImported = await addImportRecords(
        mealTable,
        mealRecords,
        "meal",
        "Erro ao importar registro de refeição.",
        errors
      );
      activitiesImported = await addImportRecords(
        activityTable,
        activityRecords,
        "activity",
        "Erro ao importar registro de atividade.",
        errors
      );
      notesImported = await addImportRecords(
        noteTable,
        noteRecords,
        "note",
        "Erro ao importar observação.",
        errors
      );
      medicationsImported = await addImportRecords(
        medicationTable,
        medicationRecords,
        "medication",
        "Erro ao importar medicamento.",
        errors
      );
    }
  );

  recordAuditAsync("data.imported", "user", userId);

  return {
    glucoseImported,
    mealsImported,
    activitiesImported,
    notesImported,
    medicationsImported,
    totalImported:
      glucoseImported + mealsImported + activitiesImported + notesImported +
      medicationsImported,
    duplicatesSkipped:
      glucoseDedup.duplicateCount +
      mealsDedup.duplicateCount +
      activitiesDedup.duplicateCount +
      notesDedup.duplicateCount +
      medicationsDedup.duplicateCount,
    errors,
  };
}
