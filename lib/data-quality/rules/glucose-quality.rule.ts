import type { GlucoseReading } from "@/lib/db/types";
import type { DataQualityIssue } from "../types";

const KNOWN_UNITS = new Set(["mg/dL", "mmol/L"]);
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const OLD_THRESHOLD_MS = 10 * ONE_YEAR_MS;

export function checkGlucoseQuality(
  record: GlucoseReading
): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (!record.provenance) {
    issues.push({
      code: "unknown_provenance",
      severity: "warning",
      field: "provenance",
      message: "Origem do registro desconhecida",
    });
  }

  if (record.value === undefined || record.value === null) {
    issues.push({
      code: "missing_value",
      severity: "warning",
      field: "value",
      message: "Valor da glicemia ausente",
    });
  }

  if (!record.unit || !KNOWN_UNITS.has(record.unit)) {
    issues.push({
      code: "unknown_unit",
      severity: "warning",
      field: "unit",
      message: "Unidade desconhecida ou ausente",
    });
  }

  const timestamp = new Date(record.measuredAt).getTime();
  if (Number.isNaN(timestamp)) {
    issues.push({
      code: "invalid_timestamp",
      severity: "warning",
      field: "measuredAt",
      message: "Timestamp inválido",
    });
  } else {
    const now = Date.now();
    if (timestamp > now + 24 * 60 * 60 * 1000) {
      issues.push({
        code: "future_timestamp",
        severity: "warning",
        field: "measuredAt",
        message: "Timestamp no futuro",
      });
    }
    if (now - timestamp > OLD_THRESHOLD_MS) {
      issues.push({
        code: "old_timestamp",
        severity: "info",
        field: "measuredAt",
        message: "Registro muito antigo",
      });
    }
  }

  if (!record.notes || record.notes.trim() === "") {
    issues.push({
      code: "missing_notes",
      severity: "info",
      field: "notes",
      message: "Observação vazia",
    });
  }

  return issues;
}
