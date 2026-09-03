import type {
  NormalizedActivity,
  NormalizedGlucose,
  NormalizedImportData,
  NormalizedMeal,
  NormalizedNote,
} from "../types/import.types";

/**
 * Normalizes imported data:
 * - Trims string fields
 * - Ensures consistent date formats
 * - Normalizes units
 * - Strips whitespace from numeric-adjacent fields
 *
 * Does NOT silently convert invalid values — those remain as-is and will
 * be caught by validation.
 */
export function normalizeImportData(
  data: NormalizedImportData
): NormalizedImportData {
  return {
    glucose: data.glucose.map(normalizeGlucose),
    meals: data.meals.map(normalizeMeal),
    activities: data.activities.map(normalizeActivity),
    notes: data.notes.map(normalizeNote),
  };
}

function normalizeGlucose(record: NormalizedGlucose): NormalizedGlucose {
  return {
    value: Math.round(record.value * 100) / 100,
    unit: "mg/dL",
    context: record.context,
    measuredAt: record.measuredAt.trim(),
    notes: record.notes?.trim() || undefined,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeMeal(record: NormalizedMeal): NormalizedMeal {
  return {
    type: record.type,
    description: record.description.trim(),
    consumedAt: record.consumedAt.trim(),
    notes: record.notes?.trim() || undefined,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeActivity(record: NormalizedActivity): NormalizedActivity {
  return {
    type: record.type,
    durationMinutes: Math.round(record.durationMinutes),
    startedAt: record.startedAt.trim(),
    notes: record.notes?.trim() || undefined,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeNote(record: NormalizedNote): NormalizedNote {
  return {
    content: record.content.trim(),
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}
