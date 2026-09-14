import type { DiaBemExport, GlucoseExportRecord, MealExportRecord, ActivityExportRecord, NoteExportRecord } from "../types/export.types";
import { CURRENT_EXPORT_VERSION, APPLICATION_NAME } from "../types/export.types";
import type { ImportValidationError } from "../types/import.types";
import {
  glucoseRecordSchema,
  mealRecordSchema,
  activityRecordSchema,
  noteRecordSchema,
  validateRecordArray,
} from "./record-validation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type JsonParseResult =
  | { ok: true; data: DiaBemExport }
  | { ok: false; errors: ImportValidationError[] };

/**
 * Parses a JSON file string into a DiaBemExport envelope.
 * Validates the envelope (version, application identity, exportedAt), the
 * data collections, and each record individually (per-record records are
 * rejected with errors). Files that do not belong to DiaBem are rejected —
 * a guard against importing data crafted for another application.
 */
export function parseJsonImport(content: string): JsonParseResult {
  const errors: ImportValidationError[] = [];

  if (content.length > MAX_FILE_SIZE) {
    return {
      ok: false,
      errors: [{ recordIndex: -1, field: "file", message: "Arquivo muito grande. O limite é 10 MB." }],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false,
      errors: [{ recordIndex: -1, field: "file", message: "Arquivo JSON inválido." }],
    };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {
      ok: false,
      errors: [{ recordIndex: -1, field: "file", message: "Estrutura JSON inválida." }],
    };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj.version !== "number") {
    errors.push({ recordIndex: -1, field: "version", message: "Campo 'version' ausente ou inválido." });
  } else if (obj.version !== CURRENT_EXPORT_VERSION) {
    errors.push({
      recordIndex: -1,
      field: "version",
      message: `Versão ${obj.version} não é compatível. Versão suportada: ${CURRENT_EXPORT_VERSION}.`,
    });
  }

  if (typeof obj.application !== "string" || obj.application !== APPLICATION_NAME) {
    const received = typeof obj.application === "string" ? obj.application : "(ausente)";
    errors.push({
      recordIndex: -1,
      field: "application",
      message: `Arquivo não pertence ao DiaBem (application: "${received}").`,
    });
  }

  if (typeof obj.exportedAt !== "string" || !isValidIsoDate(obj.exportedAt)) {
    errors.push({ recordIndex: -1, field: "exportedAt", message: "Campo 'exportedAt' ausente ou inválido." });
  }

  let glucoseRecords: unknown[] = [];
  let mealRecords: unknown[] = [];
  let activityRecords: unknown[] = [];
  let noteRecords: unknown[] = [];

  if (typeof obj.data !== "object" || obj.data === null) {
    errors.push({ recordIndex: -1, field: "data", message: "Campo 'data' ausente." });
  } else {
    const data = obj.data as Record<string, unknown>;
    if (!Array.isArray(data.glucose)) {
      errors.push({ recordIndex: -1, field: "data.glucose", message: "Campo 'data.glucose' ausente." });
    } else {
      glucoseRecords = validateRecordArray<GlucoseExportRecord>(
        data.glucose,
        glucoseRecordSchema,
        "Glicemia",
        errors,
      );
    }
    if (!Array.isArray(data.meals)) {
      errors.push({ recordIndex: -1, field: "data.meals", message: "Campo 'data.meals' ausente." });
    } else {
      mealRecords = validateRecordArray<MealExportRecord>(data.meals, mealRecordSchema, "Refeição", errors);
    }
    if (!Array.isArray(data.activities)) {
      errors.push({ recordIndex: -1, field: "data.activities", message: "Campo 'data.activities' ausente." });
    } else {
      activityRecords = validateRecordArray<ActivityExportRecord>(
        data.activities,
        activityRecordSchema,
        "Atividade",
        errors,
      );
    }
    if (!Array.isArray(data.notes)) {
      errors.push({ recordIndex: -1, field: "data.notes", message: "Campo 'data.notes' ausente." });
    } else {
      noteRecords = validateRecordArray<NoteExportRecord>(data.notes, noteRecordSchema, "Nota", errors);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      version: CURRENT_EXPORT_VERSION,
      application: APPLICATION_NAME,
      exportedAt: obj.exportedAt as string,
      data: {
        glucose: glucoseRecords,
        meals: mealRecords,
        activities: activityRecords,
        notes: noteRecords,
      },
    } as DiaBemExport,
  };
}

function isValidIsoDate(value: string): boolean {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}
