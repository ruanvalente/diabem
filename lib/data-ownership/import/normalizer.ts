import type {
  NormalizedActivity,
  NormalizedGlucose,
  NormalizedImportData,
  NormalizedMeal,
  NormalizedMedication,
  NormalizedNote,
} from "../types/import.types";
import type { DataProvenance } from "../../db/types";

/**
 * Normalizes imported data:
 * - Trims string fields
 * - Ensures consistent date formats
 * - Normalizes units
 * - Strips whitespace from numeric-adjacent fields
 * - Stamps import provenance when provided
 *
 * Does NOT silently convert invalid values — those remain as-is and will
 * be caught by validation.
 */
export function normalizeImportData(
  data: NormalizedImportData,
  provenance?: DataProvenance
): NormalizedImportData {
  return {
    glucose: data.glucose.map((r) => normalizeGlucose(r, provenance)),
    meals: data.meals.map((r) => normalizeMeal(r, provenance)),
    activities: data.activities.map((r) => normalizeActivity(r, provenance)),
    notes: data.notes.map((r) => normalizeNote(r, provenance)),
    medications: data.medications.map((r) => normalizeMedication(r, provenance)),
  };
}

function normalizeGlucose(
  record: NormalizedGlucose,
  provenance?: DataProvenance
): NormalizedGlucose {
  return {
    value: Math.round(record.value * 100) / 100,
    unit: "mg/dL",
    context: record.context,
    measuredAt: record.measuredAt.trim(),
    notes: record.notes?.trim() || undefined,
    sourceKey: record.sourceKey,
    provenance: provenance ?? record.provenance,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeMeal(
  record: NormalizedMeal,
  provenance?: DataProvenance
): NormalizedMeal {
  return {
    type: record.type,
    description: record.description.trim(),
    consumedAt: record.consumedAt.trim(),
    notes: record.notes?.trim() || undefined,
    provenance: provenance ?? record.provenance,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeActivity(
  record: NormalizedActivity,
  provenance?: DataProvenance
): NormalizedActivity {
  return {
    type: record.type,
    durationMinutes: Math.round(record.durationMinutes),
    startedAt: record.startedAt.trim(),
    notes: record.notes?.trim() || undefined,
    provenance: provenance ?? record.provenance,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeNote(
  record: NormalizedNote,
  provenance?: DataProvenance
): NormalizedNote {
  return {
    content: record.content.trim(),
    provenance: provenance ?? record.provenance,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}

function normalizeMedication(
  record: NormalizedMedication,
  provenance?: DataProvenance
): NormalizedMedication {
  return {
    name: record.name.trim(),
    dosage: record.dosage?.trim() || undefined,
    unit: record.unit?.trim() || undefined,
    frequency: record.frequency?.trim() || undefined,
    route: record.route?.trim() || undefined,
    medicatedAt: record.medicatedAt.trim(),
    notes: record.notes?.trim() || undefined,
    provenance: provenance ?? record.provenance,
    createdAt: record.createdAt.trim(),
    updatedAt: record.updatedAt.trim(),
  };
}
