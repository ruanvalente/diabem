import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import type {
  DataQualityIssue,
  DataQualityLevel,
  DataQualityResult,
} from "./types";
import { checkGlucoseQuality } from "./rules/glucose-quality.rule";
import { checkMealQuality } from "./rules/meal-quality.rule";
import { checkActivityQuality } from "./rules/activity-quality.rule";

const WARNING_PENALTY = 0.25;
const INFO_PENALTY = 0.05;

export function levelFromScore(score: number): DataQualityLevel {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  if (score > 0) return "low";
  return "unknown";
}

function computeResult(issues: DataQualityIssue[]): DataQualityResult {
  if (issues.length === 0) {
    return { score: 1, level: "high", issues };
  }

  let penalty = 0;
  for (const issue of issues) {
    penalty += issue.severity === "warning" ? WARNING_PENALTY : INFO_PENALTY;
  }

  const score = Math.max(0, Number((1 - penalty).toFixed(2)));

  return {
    score,
    level: score === 0 ? "unknown" : levelFromScore(score),
    issues,
  };
}

export function assessRecord(record: {
  kind: "glucose" | "meal" | "activity" | "note";
  data: GlucoseReading | Meal | Activity | Note;
}): DataQualityResult {
  const issues: DataQualityIssue[] =
    record.kind === "glucose"
      ? checkGlucoseQuality(record.data as GlucoseReading)
      : record.kind === "meal"
        ? checkMealQuality(record.data as Meal)
        : record.kind === "activity"
          ? checkActivityQuality(record.data as Activity)
          : [];

  return computeResult(issues);
}

export function assessDataset(records: {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
}): DataQualityResult[] {
  return [
    ...records.glucose.map((data) => assessRecord({ kind: "glucose", data })),
    ...records.meals.map((data) => assessRecord({ kind: "meal", data })),
    ...records.activities.map((data) => assessRecord({ kind: "activity", data })),
  ];
}