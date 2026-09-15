import type { Meal } from "@/lib/db/types";
import type { DataQualityIssue } from "../types";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const OLD_THRESHOLD_MS = 10 * ONE_YEAR_MS;

const MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);

export function checkMealQuality(record: Meal): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  if (!record.provenance) {
    issues.push({
      code: "unknown_provenance",
      severity: "warning",
      field: "provenance",
      message: "Origem do registro desconhecida",
    });
  }

  if (!record.type || !MEAL_TYPES.has(record.type)) {
    issues.push({
      code: "unknown_unit",
      severity: "warning",
      field: "type",
      message: "Tipo de refeição desconhecido",
    });
  }

  const timestamp = new Date(record.consumedAt).getTime();
  if (Number.isNaN(timestamp)) {
    issues.push({
      code: "invalid_timestamp",
      severity: "warning",
      field: "consumedAt",
      message: "Timestamp inválido",
    });
  } else {
    const now = Date.now();
    if (timestamp > now + 24 * 60 * 60 * 1000) {
      issues.push({
        code: "future_timestamp",
        severity: "warning",
        field: "consumedAt",
        message: "Timestamp no futuro",
      });
    }
    if (now - timestamp > OLD_THRESHOLD_MS) {
      issues.push({
        code: "old_timestamp",
        severity: "info",
        field: "consumedAt",
        message: "Registro muito antigo",
      });
    }
  }

  if (!record.description || record.description.trim() === "") {
    issues.push({
      code: "missing_required_field",
      severity: "warning",
      field: "description",
      message: "Descrição obrigatória ausente",
    });
  }

  return issues;
}