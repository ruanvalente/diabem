import type { DataContext } from "../../data-context";
import type {
  LocalIntelligenceCoverage,
  LocalIntelligenceExplanation,
} from "../intelligence-result";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_COVERAGE_DAYS = 732;

function collectTimestamps(context: DataContext): string[] {
  return [
    ...context.records.glucose.map((record) => record.measuredAt),
    ...context.records.meals.map((record) => record.consumedAt),
    ...context.records.activities.map((record) => record.startedAt),
    ...context.records.medications.map((record) => record.medicatedAt),
    ...context.records.notes.map((record) => record.createdAt),
  ];
}

export type CoverageAnalysis = {
  coverage: LocalIntelligenceCoverage;
  explanation: LocalIntelligenceExplanation;
};

/**
 * Computes data coverage over the context period: how many days have records
 * and which days are empty. Day boundaries follow the same host-local
 * convention used by the analytics engine (`toDateString`).
 *
 * For very long periods enumerating every empty day would be expensive, so
 * missing days are only listed up to `MAX_COVERAGE_DAYS` (the result is then
 * flagged with `limited`).
 */
export function analyzeCoverage(context: DataContext): CoverageAnalysis {
  const startMs = new Date(context.period.start).getTime();
  const endMs = new Date(context.period.end).getTime();
  const totalDays = Math.max(1, Math.ceil((endMs - startMs) / DAY_MS));

  const periodStartMs = Math.min(startMs, endMs);
  const periodEndMs = Math.max(startMs, endMs);

  const coveredDaysInPeriod = new Set<string>();
  for (const timestamp of collectTimestamps(context)) {
    const time = new Date(timestamp).getTime();
    if (time >= periodStartMs && time <= periodEndMs) {
      coveredDaysInPeriod.add(new Date(time).toDateString());
    }
  }

  const missingPeriods: string[] = [];
  let limited = false;

  if (totalDays <= MAX_COVERAGE_DAYS) {
    const cursor = new Date(context.period.start);
    cursor.setHours(0, 0, 0, 0);
    for (let day = 0; day < totalDays; day++) {
      if (!coveredDaysInPeriod.has(cursor.toDateString())) {
        missingPeriods.push(cursor.toISOString());
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    limited = true;
  }

  const coverage: LocalIntelligenceCoverage = {
    start: context.period.start,
    end: context.period.end,
    totalDays,
    coveredDays: coveredDaysInPeriod.size,
    missingPeriods,
    limited,
  };

  const data = [`cobertura de ${coveredDaysInPeriod.size} de ${totalDays} dias`];
  if (missingPeriods.length > 0) {
    data.push(`${missingPeriods.length} dias sem registros`);
  }
  if (limited) {
    data.push("período muito longo; dias vazios não foram enumerados");
  }

  const explanation: LocalIntelligenceExplanation = {
    rule: "coverage.days",
    description: "Dias com e sem dados no período analisado.",
    data,
  };

  return { coverage, explanation };
}