import type { Activity } from "@/lib/db/types";
import type { DataQualityIssue } from "../types";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const OLD_THRESHOLD_MS = 10 * ONE_YEAR_MS;

const ACTIVITY_TYPES = new Set([
  "walking",
  "running",
  "cycling",
  "gym",
  "stretching",
  "swimming",
  "other",
]);

export function checkActivityQuality(
  record: Activity
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

  if (!record.type || !ACTIVITY_TYPES.has(record.type)) {
    issues.push({
      code: "unknown_unit",
      severity: "warning",
      field: "type",
      message: "Tipo de atividade desconhecido",
    });
  }

  if (
    record.durationMinutes === undefined ||
    record.durationMinutes === null ||
    record.durationMinutes <= 0
  ) {
    issues.push({
      code: "missing_value",
      severity: "warning",
      field: "durationMinutes",
      message: "Duração da atividade ausente ou inválida",
    });
  }

  const timestamp = new Date(record.startedAt).getTime();
  if (Number.isNaN(timestamp)) {
    issues.push({
      code: "invalid_timestamp",
      severity: "warning",
      field: "startedAt",
      message: "Timestamp inválido",
    });
  } else {
    const now = Date.now();
    if (timestamp > now + 24 * 60 * 60 * 1000) {
      issues.push({
        code: "future_timestamp",
        severity: "warning",
        field: "startedAt",
        message: "Timestamp no futuro",
      });
    }
    if (now - timestamp > OLD_THRESHOLD_MS) {
      issues.push({
        code: "old_timestamp",
        severity: "info",
        field: "startedAt",
        message: "Registro muito antigo",
      });
    }
  }

  return issues;
}