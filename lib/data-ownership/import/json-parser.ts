import type { DiaBemExport } from "../types/export.types";
import { CURRENT_EXPORT_VERSION } from "../types/export.types";
import type { ImportValidationError } from "../types/import.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type JsonParseResult =
  | { ok: true; data: DiaBemExport }
  | { ok: false; errors: ImportValidationError[] };

/**
 * Parses a JSON file string into a DiaBemExport envelope.
 * Validates structure, version, and required fields before returning.
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

  // Version validation
  if (typeof obj.version !== "number") {
    errors.push({ recordIndex: -1, field: "version", message: "Campo 'version' ausente ou inválido." });
  } else if (obj.version !== CURRENT_EXPORT_VERSION) {
    errors.push({
      recordIndex: -1,
      field: "version",
      message: `Versão ${obj.version} não é compatível. Versão suportada: ${CURRENT_EXPORT_VERSION}.`,
    });
  }

  // Application validation
  if (typeof obj.application !== "string" || obj.application.length === 0) {
    errors.push({ recordIndex: -1, field: "application", message: "Campo 'application' ausente." });
  }

  // ExportedAt validation
  if (typeof obj.exportedAt !== "string" || !isValidIsoDate(obj.exportedAt)) {
    errors.push({ recordIndex: -1, field: "exportedAt", message: "Campo 'exportedAt' ausente ou inválido." });
  }

  // Data validation
  if (typeof obj.data !== "object" || obj.data === null) {
    errors.push({ recordIndex: -1, field: "data", message: "Campo 'data' ausente." });
  } else {
    const data = obj.data as Record<string, unknown>;
    if (!Array.isArray(data.glucose)) {
      errors.push({ recordIndex: -1, field: "data.glucose", message: "Campo 'data.glucose' ausente." });
    }
    if (!Array.isArray(data.meals)) {
      errors.push({ recordIndex: -1, field: "data.meals", message: "Campo 'data.meals' ausente." });
    }
    if (!Array.isArray(data.activities)) {
      errors.push({ recordIndex: -1, field: "data.activities", message: "Campo 'data.activities' ausente." });
    }
    if (!Array.isArray(data.notes)) {
      errors.push({ recordIndex: -1, field: "data.notes", message: "Campo 'data.notes' ausente." });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: parsed as DiaBemExport };
}

function isValidIsoDate(value: string): boolean {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}
