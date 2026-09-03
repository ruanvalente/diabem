import type { ImportFileKind, ImportValidationError } from "../types/import.types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Detects file kind from extension and content.
 */
export function detectFileKind(
  fileName: string,
  content: string
): ImportFileKind {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv")) return "csv";

  // Fallback: detect from content
  const trimmed = content.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";

  return "unknown";
}

/**
 * Validates file-level constraints before parsing.
 */
export function validateFile(
  file: File
): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      recordIndex: -1,
      field: "file",
      message: "Arquivo muito grande. O limite é 10 MB.",
    });
  }

  if (file.size === 0) {
    errors.push({
      recordIndex: -1,
      field: "file",
      message: "Arquivo vazio.",
    });
  }

  return errors;
}
