import type { Medication } from "@/lib/db/types";
import type { DataQualityIssue } from "../types";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const OLD_THRESHOLD_MS = 10 * ONE_YEAR_MS;

export function checkMedicationQuality(record: Medication): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (!record.provenance) {
    issues.push({
      code: "unknown_provenance",
      severity: "warning",
      field: "provenance",
      message: "Origem do registro desconhecida",
    });
  }

  const timestamp = new Date(record.medicatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    issues.push({
      code: "invalid_timestamp",
      severity: "warning",
      field: "medicatedAt",
      message: "Timestamp inválido",
    });
  } else {
    const now = Date.now();
    if (timestamp > now + 24 * 60 * 60 * 1000) {
      issues.push({
        code: "future_timestamp",
        severity: "warning",
        field: "medicatedAt",
        message: "Timestamp no futuro",
      });
    }
    if (now - timestamp > OLD_THRESHOLD_MS) {
      issues.push({
        code: "old_timestamp",
        severity: "info",
        field: "medicatedAt",
        message: "Registro muito antigo",
      });
    }
  }

  if (!record.name || record.name.trim() === "") {
    issues.push({
      code: "missing_required_field",
      severity: "warning",
      field: "name",
      message: "Nome do medicamento obrigatório ausente",
    });
  }

  return issues;
}