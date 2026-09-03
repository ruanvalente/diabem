import type {
  ActivityExportRecord,
  GlucoseExportRecord,
  MealExportRecord,
  NoteExportRecord,
} from "../types/export.types";

/**
 * CSV delimiter. Comma is used for broad interoperability.
 * The import parser handles auto-detection of common delimiters.
 */
const DELIMITER = ",";

/**
 * Escapes a value for safe CSV output.
 * - Wraps in quotes if the value contains the delimiter, quotes, or newlines.
 * - Doubles any existing quotes inside the value.
 * - Sanitizes CSV injection characters (=, +, -, @) at the start of values.
 */
function escapeCsvValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";

  const str = String(value);

  // CSV Injection prevention: prefix formula-triggering characters
  const firstChar = str.charAt(0);
  if (["=", "+", "-", "@"].includes(firstChar)) {
    const escaped = `'${str}`;
    return quoteIfNeeded(escaped);
  }

  return quoteIfNeeded(str);
}

function quoteIfNeeded(value: string): string {
  if (
    value.includes(DELIMITER) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const BOM = "\uFEFF";
  const headerLine = headers.join(DELIMITER);
  const dataLines = rows.map((row) => row.join(DELIMITER));
  return BOM + [headerLine, ...dataLines].join("\n");
}

export function serializeGlucoseToCsv(
  records: GlucoseExportRecord[]
): string {
  const headers = [
    "id",
    "timestamp",
    "value",
    "unit",
    "context",
    "notes",
    "createdAt",
    "updatedAt",
  ];

  const rows = records.map((r) => [
    escapeCsvValue(r.id),
    escapeCsvValue(r.measuredAt),
    escapeCsvValue(r.value),
    escapeCsvValue(r.unit),
    escapeCsvValue(r.context),
    escapeCsvValue(r.notes),
    escapeCsvValue(r.createdAt),
    escapeCsvValue(r.updatedAt),
  ]);

  return buildCsv(headers, rows);
}

export function serializeMealsToCsv(records: MealExportRecord[]): string {
  const headers = [
    "id",
    "timestamp",
    "type",
    "description",
    "notes",
    "createdAt",
    "updatedAt",
  ];

  const rows = records.map((r) => [
    escapeCsvValue(r.id),
    escapeCsvValue(r.consumedAt),
    escapeCsvValue(r.type),
    escapeCsvValue(r.description),
    escapeCsvValue(r.notes),
    escapeCsvValue(r.createdAt),
    escapeCsvValue(r.updatedAt),
  ]);

  return buildCsv(headers, rows);
}

export function serializeActivitiesToCsv(
  records: ActivityExportRecord[]
): string {
  const headers = [
    "id",
    "timestamp",
    "type",
    "durationMinutes",
    "notes",
    "createdAt",
    "updatedAt",
  ];

  const rows = records.map((r) => [
    escapeCsvValue(r.id),
    escapeCsvValue(r.startedAt),
    escapeCsvValue(r.type),
    escapeCsvValue(r.durationMinutes),
    escapeCsvValue(r.notes),
    escapeCsvValue(r.createdAt),
    escapeCsvValue(r.updatedAt),
  ]);

  return buildCsv(headers, rows);
}

export function serializeNotesToCsv(records: NoteExportRecord[]): string {
  const headers = ["id", "timestamp", "content", "createdAt", "updatedAt"];

  const rows = records.map((r) => [
    escapeCsvValue(r.id),
    escapeCsvValue(r.createdAt),
    escapeCsvValue(r.content),
    escapeCsvValue(r.createdAt),
    escapeCsvValue(r.updatedAt),
  ]);

  return buildCsv(headers, rows);
}
