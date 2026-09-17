import type { AnalysisPeriod } from "../types/analytics.types";
import type { GlucoseReading, Meal, Activity } from "@/lib/db/types";

export function inPeriod(timestamp: string, period: AnalysisPeriod): boolean {
  const t = new Date(timestamp).getTime();
  return (
    t >= new Date(period.start).getTime() &&
    t <= new Date(period.end).getTime()
  );
}

export function glucoseInPeriod(
  records: GlucoseReading[],
  period: AnalysisPeriod
): GlucoseReading[] {
  return records.filter((r) => inPeriod(r.measuredAt, period));
}

export function mealsInPeriod(
  records: Meal[],
  period: AnalysisPeriod
): Meal[] {
  return records.filter((r) => inPeriod(r.consumedAt, period));
}

export function activitiesInPeriod(
  records: Activity[],
  period: AnalysisPeriod
): Activity[] {
  return records.filter((r) => inPeriod(r.startedAt, period));
}

export function recordIds<T extends { id: string }>(records: T[]): string[] {
  return records.map((r) => r.id);
}