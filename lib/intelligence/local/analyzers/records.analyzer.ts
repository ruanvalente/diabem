import type { DataContext } from "../../data-context";
import type { DataRecordKind } from "../../data-context";
import type {
  LocalIntelligenceExplanation,
  LocalIntelligenceSummary,
} from "../intelligence-result";

const RECORD_KINDS: DataRecordKind[] = [
  "glucose",
  "meals",
  "activities",
  "medications",
  "notes",
];

function countRecords(context: DataContext): Record<DataRecordKind, number> {
  return {
    glucose: context.records.glucose.length,
    meals: context.records.meals.length,
    activities: context.records.activities.length,
    medications: context.records.medications.length,
    notes: context.records.notes.length,
  };
}

const KIND_LABELS: Record<DataRecordKind, string> = {
  glucose: "glicemia",
  meals: "alimentação",
  activities: "atividades",
  medications: "medicamentos",
  notes: "observações",
};

export type RecordsAnalysis = {
  summary: LocalIntelligenceSummary;
  explanation: LocalIntelligenceExplanation;
};

/**
 * Counts the available records by type. The result is structural only — it
 * answers "how many records exist and which types", never a medical claim.
 */
export function analyzeRecords(context: DataContext): RecordsAnalysis {
  const counts = countRecords(context);

  const totalRecords = RECORD_KINDS.reduce(
    (sum, kind) => sum + counts[kind],
    0
  );
  const availableRecordTypes = RECORD_KINDS.filter(
    (kind) => counts[kind] > 0
  );

  const summary: LocalIntelligenceSummary = {
    totalRecords,
    availableRecordTypes,
    counts,
  };

  const explanation: LocalIntelligenceExplanation = {
    rule: "records.count",
    description: "Quantidade de registros por tipo no período.",
    data: [
      `${totalRecords} registros no total`,
      ...availableRecordTypes.map(
        (kind) => `${KIND_LABELS[kind]}: ${counts[kind]}`
      ),
    ],
  };

  return { summary, explanation };
}