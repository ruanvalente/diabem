import { computeIntelligenceAnalytics } from "./analytics/analytics-engine";
import { compareGlucosePeriods } from "./analytics/period-comparison";
import { evaluateAllRules } from "./rules/rule-engine";
import { generateInsights } from "./insights/insight-generator";
import type { IntelligenceResult } from "./types/worker.types";
import type {
  AnalysisPeriod,
  IntelligenceAnalytics,
} from "./types/analytics.types";
import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import type { Pattern } from "./types/rule.types";
import type { Insight } from "./types/insight.types";

export type IntelligenceServiceResult =
  | { ok: true; data: IntelligenceResult }
  | { ok: false; error: string };

function computeComparisons(
  glucose: GlucoseReading[],
  currentStart: number,
  currentEnd: number
) {
  const periodLengthMs = currentEnd - currentStart;
  const previousStartMs = currentStart - periodLengthMs;

  const current = glucose.filter((g) => {
    const t = new Date(g.measuredAt).getTime();
    return t >= currentStart && t < currentEnd;
  });

  const previous = glucose.filter((g) => {
    const t = new Date(g.measuredAt).getTime();
    return t >= previousStartMs && t < currentStart;
  });

  return compareGlucosePeriods(current, previous);
}

export function analyzeIntelligence(
  glucose: GlucoseReading[],
  meals: Meal[],
  activities: Activity[],
  notes: Note[],
  period: AnalysisPeriod
): IntelligenceServiceResult {
  try {
    const currentStartMs = new Date(period.start).getTime();
    const currentEndMs = new Date(period.end).getTime();

    const comparisons = computeComparisons(
      glucose,
      currentStartMs,
      currentEndMs
    );

    const analytics = computeIntelligenceAnalytics(
      glucose,
      meals,
      activities,
      period
    );
    analytics.comparisons = comparisons;

    const patterns = evaluateAllRules({
      period,
      analytics,
      dataQuality: analytics.dataQuality,
    });

    const insights = generateInsights(patterns);

    return {
      ok: true,
      data: {
        period,
        analytics,
        patterns,
        insights,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao analisar os dados",
    };
  }
}

export function getGlucoseSummary(
  analytics: IntelligenceAnalytics
): { count: number; average?: number; minimum?: number; maximum?: number } {
  return {
    count: analytics.glucose?.stats.count ?? 0,
    average: analytics.glucose?.stats.average,
    minimum: analytics.glucose?.stats.minimum,
    maximum: analytics.glucose?.stats.maximum,
  };
}

export function getTimeline(
  glucose: GlucoseReading[],
  meals: Meal[],
  activities: Activity[],
  notes: Note[]
): { at: string; type: string }[] {
  return [
    ...glucose.map((g) => ({ at: g.measuredAt, type: "glucose" })),
    ...meals.map((m) => ({ at: m.consumedAt, type: "meal" })),
    ...activities.map((a) => ({ at: a.startedAt, type: "activity" })),
    ...notes.map((n) => ({ at: n.createdAt, type: "note" })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

export function getMealSummary(
  analytics: IntelligenceAnalytics
): { totalCount: number; byType: { type: string; count: number }[] } {
  return {
    totalCount: analytics.meals?.totalCount ?? 0,
    byType: analytics.meals?.byType ?? [],
  };
}

export function getActivitySummary(
  analytics: IntelligenceAnalytics
): { totalCount: number; totalMinutes: number } {
  return {
    totalCount: analytics.activities?.totalCount ?? 0,
    totalMinutes: analytics.activities?.totalMinutes ?? 0,
  };
}

export function getInsights(patterns: Pattern[]): Insight[] {
  return generateInsights(patterns);
}

export function comparePeriods(
  glucose: GlucoseReading[],
  period: AnalysisPeriod
) {
  return computeComparisons(
    glucose,
    new Date(period.start).getTime(),
    new Date(period.end).getTime()
  );
}
