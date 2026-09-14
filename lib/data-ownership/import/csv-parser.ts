import type {
  ImportValidationError,
  NormalizedActivity,
  NormalizedGlucose,
  NormalizedImportData,
  NormalizedMeal,
} from "../types/import.types";
import {
  MAX_NOTE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_CONTENT_LENGTH,
} from "../../security/sanitization/text";

/**
 * Parses a CSV string into rows of columns.
 * Handles quoted fields with commas, newlines, and escaped quotes.
 */
function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        current.push(field);
        field = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        current.push(field);
        field = "";
        if (current.some((f) => f.trim() !== "")) {
          rows.push(current);
        }
        current = [];
        if (char === "\r") i++;
      } else {
        field += char;
      }
    }
  }

  current.push(field);
  if (current.some((f) => f.trim() !== "")) {
    rows.push(current);
  }

  return rows;
}

function stripBom(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1);
  }
  return content;
}

function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

function isValidDate(value: string): boolean {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Strips the CSV injection prevention prefix (`'`) added by `escapeCsvValue`
 * on export, but only when the field starts with the apostrophe and the next
 * non-space character is one of the formula-triggering characters (=, +, -, @).
 * This mirrors the export guard's `trimStart()` logic to prevent round-trip
 * accumulation of `'` prefixes on re-import.
 */
function unescapeCsvInjectionGuard(value: string): string {
  if (value.length >= 2 && value.charAt(0) === "'") {
    const remainder = value.slice(1);
    const firstNonSpace = remainder.trimStart().charAt(0);
    if (["=", "+", "-", "@", "\t", "\r"].includes(firstNonSpace)) {
      return remainder;
    }
  }
  return value;
}

/**
 * Validates that a text field does not exceed a given length cap.
 * Returns the trimmed value, or `undefined` and pushes an error if over limit.
 */
function cappedTextField(
  value: string,
  maxLength: number,
  fieldName: string,
  recordIndex: number,
  errors: ImportValidationError[],
): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  if (trimmed.length > maxLength) {
    errors.push({
      recordIndex,
      field: fieldName,
      message: `Texto excede o limite de ${maxLength} caracteres.`,
    });
    return undefined;
  }
  return trimmed;
}

type CsvParseResult =
  | { ok: true; data: NormalizedImportData; errors: ImportValidationError[] }
  | { ok: false; errors: ImportValidationError[] };

/**
 * Parses CSV content. Detects entity type from header columns.
 * Returns normalized records ready for deduplication and import.
 */
export function parseCsvImport(content: string): CsvParseResult {
  const clean = stripBom(content);
  const rows = parseCsvRows(clean);

  if (rows.length < 2) {
    return {
      ok: false,
      errors: [{ recordIndex: -1, field: "file", message: "Arquivo CSV vazio ou sem dados." }],
    };
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  const errors: ImportValidationError[] = [];
  const data: NormalizedImportData = {
    glucose: [],
    meals: [],
    activities: [],
    notes: [],
  };

  if (headers.includes("value") && headers.includes("context")) {
    parseGlucoseRows(headers, dataRows, data, errors);
  } else if (headers.includes("type") && headers.includes("description")) {
    parseMealRows(headers, dataRows, data, errors);
  } else if (headers.includes("type") && headers.includes("durationminutes")) {
    parseActivityRows(headers, dataRows, data, errors);
  } else if (headers.includes("content")) {
    parseNoteRows(headers, dataRows, data, errors);
  } else {
    return {
      ok: false,
      errors: [{ recordIndex: -1, field: "file", message: "Formato CSV não reconhecido." }],
    };
  }

  const totalParsed =
    data.glucose.length +
    data.meals.length +
    data.activities.length +
    data.notes.length;

  return { ok: totalParsed > 0, data, errors };
}

function getCol(headers: string[], name: string): number {
  return headers.indexOf(name.toLowerCase());
}

/**
 * Returns the column index for a timestamp field.
 * Checks the entity-specific column first (e.g. "consumedat", "startedat"),
 * then falls back to the generic "timestamp" column used by the app's CSV export.
 */
function getTimestampCol(headers: string[], entitySpecificName: string): number {
  const specific = getCol(headers, entitySpecificName);
  if (specific !== -1) return specific;
  return getCol(headers, "timestamp");
}

function parseGlucoseRows(
  headers: string[],
  rows: string[][],
  data: NormalizedImportData,
  errors: ImportValidationError[]
): void {
  const tsIdx = getCol(headers, "timestamp");
  const valIdx = getCol(headers, "value");
  const ctxIdx = getCol(headers, "context");
  const notesIdx = getCol(headers, "notes");
  const createdIdx = getCol(headers, "createdat");
  const updatedIdx = getCol(headers, "updatedat");

  rows.forEach((row, i) => {
    const value = toNumber(row[valIdx]);
    if (value === undefined || value < 0 || value > 1000) {
      errors.push({ recordIndex: i + 2, field: "value", message: "Valor de glicemia inválido." });
      return;
    }

    const context = row[ctxIdx]?.trim();
    if (!context || !["fasting", "before_meal", "after_meal", "bedtime", "other"].includes(context)) {
      errors.push({ recordIndex: i + 2, field: "context", message: "Contexto de glicemia inválido." });
      return;
    }

    const timestamp = row[tsIdx]?.trim();
    if (!timestamp || !isValidDate(timestamp)) {
      errors.push({ recordIndex: i + 2, field: "timestamp", message: "Data inválida." });
      return;
    }

    const createdAt = row[createdIdx]?.trim() || timestamp;
    const updatedAt = row[updatedIdx]?.trim() || createdAt;

    const rawNotes = row[notesIdx] ? unescapeCsvInjectionGuard(row[notesIdx]) : "";
    const notes = cappedTextField(rawNotes, MAX_NOTE_LENGTH, "notes", i + 2, errors);

    data.glucose.push({
      value,
      unit: "mg/dL",
      context: context as NormalizedGlucose["context"],
      measuredAt: timestamp,
      notes,
      createdAt: isValidDate(createdAt) ? createdAt : timestamp,
      updatedAt: isValidDate(updatedAt) ? updatedAt : createdAt,
    });
  });
}

function parseMealRows(
  headers: string[],
  rows: string[][],
  data: NormalizedImportData,
  errors: ImportValidationError[]
): void {
  const tsIdx = getTimestampCol(headers, "consumedat");
  const typeIdx = getCol(headers, "type");
  const descIdx = getCol(headers, "description");
  const notesIdx = getCol(headers, "notes");
  const createdIdx = getCol(headers, "createdat");
  const updatedIdx = getCol(headers, "updatedat");

  rows.forEach((row, i) => {
    const type = row[typeIdx]?.trim();
    if (!type || !["breakfast", "lunch", "dinner", "snack"].includes(type)) {
      errors.push({ recordIndex: i + 2, field: "type", message: "Tipo de refeição inválido." });
      return;
    }

    const descriptionClean = row[descIdx] ? unescapeCsvInjectionGuard(row[descIdx]).trim() : "";
    if (descriptionClean.length < 2) {
      errors.push({ recordIndex: i + 2, field: "description", message: "Descrição inválida." });
      return;
    }
    if (descriptionClean.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({ recordIndex: i + 2, field: "description", message: `Descrição excede o limite de ${MAX_DESCRIPTION_LENGTH} caracteres.` });
      return;
    }

    const timestamp = row[tsIdx]?.trim();
    if (!timestamp || !isValidDate(timestamp)) {
      errors.push({ recordIndex: i + 2, field: "timestamp", message: "Data inválida." });
      return;
    }

    const createdAt = row[createdIdx]?.trim() || timestamp;
    const updatedAt = row[updatedIdx]?.trim() || createdAt;

    const rawNotes = row[notesIdx] ? unescapeCsvInjectionGuard(row[notesIdx]) : "";
    const notes = cappedTextField(rawNotes, MAX_NOTE_LENGTH, "notes", i + 2, errors);

    data.meals.push({
      type: type as NormalizedMeal["type"],
      description: descriptionClean,
      consumedAt: timestamp,
      notes,
      createdAt: isValidDate(createdAt) ? createdAt : timestamp,
      updatedAt: isValidDate(updatedAt) ? updatedAt : createdAt,
    });
  });
}

function parseActivityRows(
  headers: string[],
  rows: string[][],
  data: NormalizedImportData,
  errors: ImportValidationError[]
): void {
  const tsIdx = getTimestampCol(headers, "startedat");
  const typeIdx = getCol(headers, "type");
  const durIdx = getCol(headers, "durationminutes");
  const notesIdx = getCol(headers, "notes");
  const createdIdx = getCol(headers, "createdat");
  const updatedIdx = getCol(headers, "updatedat");

  rows.forEach((row, i) => {
    const type = row[typeIdx]?.trim();
    if (!type || !["walking", "running", "cycling", "gym", "stretching", "swimming", "other"].includes(type)) {
      errors.push({ recordIndex: i + 2, field: "type", message: "Tipo de atividade inválido." });
      return;
    }

    const duration = toNumber(row[durIdx]);
    if (duration === undefined || duration < 1 || duration > 1440 || !Number.isInteger(duration)) {
      errors.push({ recordIndex: i + 2, field: "durationMinutes", message: "Duração inválida." });
      return;
    }

    const timestamp = row[tsIdx]?.trim();
    if (!timestamp || !isValidDate(timestamp)) {
      errors.push({ recordIndex: i + 2, field: "timestamp", message: "Data inválida." });
      return;
    }

    const createdAt = row[createdIdx]?.trim() || timestamp;
    const updatedAt = row[updatedIdx]?.trim() || createdAt;

    const rawNotes = row[notesIdx] ? unescapeCsvInjectionGuard(row[notesIdx]) : "";
    const notes = cappedTextField(rawNotes, MAX_NOTE_LENGTH, "notes", i + 2, errors);

    data.activities.push({
      type: type as NormalizedActivity["type"],
      durationMinutes: duration,
      startedAt: timestamp,
      notes,
      createdAt: isValidDate(createdAt) ? createdAt : timestamp,
      updatedAt: isValidDate(updatedAt) ? updatedAt : createdAt,
    });
  });
}

function parseNoteRows(
  headers: string[],
  rows: string[][],
  data: NormalizedImportData,
  errors: ImportValidationError[]
): void {
  const tsIdx = getTimestampCol(headers, "createdat");
  const contentIdx = getCol(headers, "content");
  const createdIdx = getCol(headers, "createdat");
  const updatedIdx = getCol(headers, "updatedat");

  rows.forEach((row, i) => {
    const contentRaw = row[contentIdx] ? unescapeCsvInjectionGuard(row[contentIdx]).trim() : "";
    if (contentRaw.length < 1) {
      errors.push({ recordIndex: i + 2, field: "content", message: "Conteúdo vazio." });
      return;
    }
    if (contentRaw.length > MAX_CONTENT_LENGTH) {
      errors.push({ recordIndex: i + 2, field: "content", message: `Conteúdo excede o limite de ${MAX_CONTENT_LENGTH} caracteres.` });
      return;
    }

    const timestamp = row[tsIdx]?.trim();
    const createdAt = row[createdIdx]?.trim() || timestamp || new Date().toISOString();
    const updatedAt = row[updatedIdx]?.trim() || createdAt;

    data.notes.push({
      content: contentRaw,
      createdAt: isValidDate(createdAt) ? createdAt : new Date().toISOString(),
      updatedAt: isValidDate(updatedAt) ? updatedAt : createdAt,
    });
  });
}
