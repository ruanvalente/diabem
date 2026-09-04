import type {
  ImportValidationError,
  NormalizedActivity,
  NormalizedGlucose,
  NormalizedImportData,
  NormalizedMeal,
} from "../types/import.types";

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
        i++; // skip escaped quote
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
        if (char === "\r") i++; // skip \n after \r
      } else {
        field += char;
      }
    }
  }

  // Last field/row
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

  // Detect entity type from headers
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

    data.glucose.push({
      value,
      unit: "mg/dL",
      context: context as NormalizedGlucose["context"],
      measuredAt: timestamp,
      notes: row[notesIdx]?.trim() || undefined,
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

    const description = row[descIdx]?.trim();
    if (!description || description.length < 2) {
      errors.push({ recordIndex: i + 2, field: "description", message: "Descrição inválida." });
      return;
    }

    const timestamp = row[tsIdx]?.trim();
    if (!timestamp || !isValidDate(timestamp)) {
      errors.push({ recordIndex: i + 2, field: "timestamp", message: "Data inválida." });
      return;
    }

    const createdAt = row[createdIdx]?.trim() || timestamp;
    const updatedAt = row[updatedIdx]?.trim() || createdAt;

    data.meals.push({
      type: type as NormalizedMeal["type"],
      description,
      consumedAt: timestamp,
      notes: row[notesIdx]?.trim() || undefined,
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

    data.activities.push({
      type: type as NormalizedActivity["type"],
      durationMinutes: duration,
      startedAt: timestamp,
      notes: row[notesIdx]?.trim() || undefined,
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
    const content = row[contentIdx]?.trim();
    if (!content || content.length < 1) {
      errors.push({ recordIndex: i + 2, field: "content", message: "Conteúdo vazio." });
      return;
    }

    const timestamp = row[tsIdx]?.trim();
    const createdAt = row[createdIdx]?.trim() || timestamp || new Date().toISOString();
    const updatedAt = row[updatedIdx]?.trim() || createdAt;

    data.notes.push({
      content,
      createdAt: isValidDate(createdAt) ? createdAt : new Date().toISOString(),
      updatedAt: isValidDate(updatedAt) ? updatedAt : createdAt,
    });
  });
}
