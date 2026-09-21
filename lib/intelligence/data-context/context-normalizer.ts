import type {
  Activity,
  DataProvenance,
  GlucoseReading,
  Meal,
  Medication,
  Note,
} from "@/lib/db/types";
import type {
  DataContextProvenanceSummary,
  NormalizedActivityRecord,
  NormalizedGlucoseRecord,
  NormalizedMealRecord,
  NormalizedMedicationRecord,
  NormalizedNoteRecord,
} from "./data-context.types";

export function normalizeGlucoseRecord(
  record: GlucoseReading
): NormalizedGlucoseRecord {
  return {
    kind: "glucose",
    id: record.id,
    value: record.value,
    context: record.context,
    measuredAt: record.measuredAt,
    notes: record.notes,
    provenance: record.provenance,
  };
}

export function normalizeMealRecord(record: Meal): NormalizedMealRecord {
  return {
    kind: "meal",
    id: record.id,
    type: record.type,
    description: record.description,
    consumedAt: record.consumedAt,
    notes: record.notes,
    provenance: record.provenance,
  };
}

export function normalizeActivityRecord(
  record: Activity
): NormalizedActivityRecord {
  return {
    kind: "activity",
    id: record.id,
    type: record.type,
    durationMinutes: record.durationMinutes,
    startedAt: record.startedAt,
    notes: record.notes,
    provenance: record.provenance,
  };
}

export function normalizeMedicationRecord(
  record: Medication
): NormalizedMedicationRecord {
  return {
    kind: "medication",
    id: record.id,
    name: record.name,
    dosage: record.dosage,
    unit: record.unit,
    frequency: record.frequency,
    route: record.route,
    medicatedAt: record.medicatedAt,
    provenance: record.provenance,
  };
}

export function normalizeNoteRecord(record: Note): NormalizedNoteRecord {
  return {
    kind: "note",
    id: record.id,
    content: record.content,
    createdAt: record.createdAt,
    provenance: record.provenance,
  };
}

/**
 * Builds the provenance summary for a set of records. Records without a
 * `provenance.source` are counted as unknown. The original provenance is never
 * altered — this is a derived aggregation.
 */
export function summarizeProvenance(
  records: { provenance?: DataProvenance }[]
): DataContextProvenanceSummary {
  const bySource = new Map<DataProvenance["source"], number>();
  let unknown = 0;

  for (const record of records) {
    const source = record.provenance?.source;
    if (source) {
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
    } else {
      unknown += 1;
    }
  }

  const totalRecords = records.length;

  return {
    bySource: [...bySource.entries()].map(([source, count]) => ({
      source,
      count,
    })),
    knownSourceRate: totalRecords === 0 ? 0 : (totalRecords - unknown) / totalRecords,
    unknownSourceCount: unknown,
    totalRecords,
  };
}