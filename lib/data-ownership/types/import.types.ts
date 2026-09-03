import type {
  Activity,
  GlucoseReading,
  Meal,
  Note,
} from "../../db/types";

export type ImportMode = "merge";

export type ImportFileKind = "json" | "csv" | "unknown";

export type ImportState =
  | "idle"
  | "selecting"
  | "reading"
  | "validating"
  | "preview"
  | "importing"
  | "success"
  | "error"
  | "cancelled";

export type ImportValidationError = {
  recordIndex: number;
  field: string;
  message: string;
};

export type ImportPreview = {
  fileName: string;
  fileKind: ImportFileKind;
  glucoseCount: number;
  mealsCount: number;
  activitiesCount: number;
  notesCount: number;
  totalRecords: number;
  duplicateCount: number;
  errorCount: number;
  errors: ImportValidationError[];
};

export type ImportResult = {
  glucoseImported: number;
  mealsImported: number;
  activitiesImported: number;
  notesImported: number;
  totalImported: number;
  duplicatesSkipped: number;
  errors: ImportValidationError[];
};

/**
 * Normalized record ready for repository insertion (userId stripped — caller
 * assigns). Original timestamps are preserved for data fidelity and
 * deduplication; `id` is stripped so a new ID is generated on import.
 */
export type NormalizedGlucose = Omit<GlucoseReading, "userId" | "id">;
export type NormalizedMeal = Omit<Meal, "userId" | "id">;
export type NormalizedActivity = Omit<Activity, "userId" | "id">;
export type NormalizedNote = Omit<Note, "userId" | "id">;

export type NormalizedImportData = {
  glucose: NormalizedGlucose[];
  meals: NormalizedMeal[];
  activities: NormalizedActivity[];
  notes: NormalizedNote[];
};
