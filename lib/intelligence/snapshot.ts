import type {
  AnalysisPeriod,
  AnalyticsSnapshot,
} from "./types/analytics.types";
import { INTELLIGENCE_ENGINE_VERSION } from "./types/analytics.types";

/**
 * Builds the descriptive snapshot of the analyzed context. Shared by the
 * synchronous service and the Web Worker so the snapshot shape can only
 * drift in one place.
 */
export function buildSnapshot(
  glucose: { id: string }[],
  meals: { id: string }[],
  activities: { id: string }[],
  period: AnalysisPeriod
): AnalyticsSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    period,
    recordCount: glucose.length + meals.length + activities.length,
    sourceIds: [
      ...glucose.map((g) => g.id),
      ...meals.map((m) => m.id),
      ...activities.map((a) => a.id),
    ],
    engineVersion: INTELLIGENCE_ENGINE_VERSION,
  };
}