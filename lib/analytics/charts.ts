import type { Activity, GlucoseReading, Meal } from "@/lib/db/types";
import {
  addDays,
  formatDateMonthDay,
  getLocalDayKey,
  dayLabel,
  startOfLocalDay,
} from "@/lib/date";
import type {
  ActivityChartData,
  DistributionData,
  GlucoseChartData,
  MealChartData,
  RecordPeriod,
} from "./types";

const MAX_CHART_DAYS = 31;

const DISTRIBUTION_ORDER: RecordPeriod[] = ["morning", "afternoon", "evening"];

const DISTRIBUTION_LABELS: Record<RecordPeriod, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
};

function buildDayBuckets(
  range: { from?: string; to?: string },
  now: Date = new Date(),
): { key: string; label: string; date: Date }[] {
  const today = startOfLocalDay(now);
  const upperBound = range.to ? new Date(range.to) : addDays(today, 1);
  const end = range.to ? startOfLocalDay(upperBound) : today;
  const lastInclusive = addDays(end, range.to ? -1 : 0);

  let start = range.from
    ? startOfLocalDay(new Date(range.from))
    : addDays(lastInclusive, -(MAX_CHART_DAYS - 1));
  const minStart = addDays(lastInclusive, -(MAX_CHART_DAYS - 1));
  if (start.getTime() < minStart.getTime()) start = minStart;

  const buckets: { key: string; label: string; date: Date }[] = [];
  for (
    let day = start;
    day.getTime() <= lastInclusive.getTime();
    day = addDays(day, 1)
  ) {
    const key = getLocalDayKey(day);
    buckets.push({ key, label: chartDayLabel(day, now), date: day });
  }
  return buckets;
}

function chartDayLabel(date: Date, now: Date): string {
  const label = dayLabel(date.toISOString(), now);
  if (label === "Hoje" || label === "Ontem") return label;
  return date.toLocaleDateString("pt-BR", { weekday: "short" });
}

/** Inclusive local-day bounds (ms) of the full requested period. */
function periodBounds(
  range: { from?: string; to?: string },
  now: Date,
): { from: number; to: number } {
  const today = startOfLocalDay(now).getTime();
  const boundTo = range.to
    ? addDays(startOfLocalDay(new Date(range.to)), -1).getTime()
    : today;
  const boundFrom = range.from
    ? startOfLocalDay(new Date(range.from)).getTime()
    : Number.NEGATIVE_INFINITY;
  return { from: boundFrom, to: boundTo };
}

export function getGlucoseChartData(
  readings: GlucoseReading[],
): GlucoseChartData {
  const sorted = [...readings].sort((a, b) =>
    a.measuredAt.localeCompare(b.measuredAt),
  );
  const points = sorted.map((reading) => ({
    key: reading.id,
    label: formatDateMonthDay(reading.measuredAt),
    value: reading.value,
  }));

  const values = sorted.map((reading) => reading.value);
  const average =
    values.length === 0
      ? null
      : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) /
        10;

  return {
    points,
    count: values.length,
    average,
    minimum: values.length ? Math.min(...values) : null,
    maximum: values.length ? Math.max(...values) : null,
  };
}

export function getActivityChartData(
  activities: Activity[],
  range: { from?: string; to?: string },
  now: Date = new Date(),
): ActivityChartData {
  const buckets = buildDayBuckets(range, now);
  const totals = new Map(buckets.map((bucket) => [bucket.key, 0]));
  const bounds = periodBounds(range, now);
  let totalMinutes = 0;

  for (const activity of activities) {
    const startedAt = new Date(activity.startedAt);
    const dayTime = startOfLocalDay(startedAt).getTime();
    if (dayTime < bounds.from || dayTime > bounds.to) continue;
    totalMinutes += activity.durationMinutes;
    const key = getLocalDayKey(startedAt);
    if (totals.has(key)) {
      totals.set(key, totals.get(key)! + activity.durationMinutes);
    }
  }

  return {
    days: buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      value: totals.get(bucket.key)!,
    })),
    totalMinutes,
  };
}

export function getMealChartData(
  meals: Meal[],
  range: { from?: string; to?: string },
  now: Date = new Date(),
): MealChartData {
  const buckets = buildDayBuckets(range, now);
  const counts = new Map(buckets.map((bucket) => [bucket.key, 0]));

  for (const meal of meals) {
    const key = getLocalDayKey(new Date(meal.consumedAt));
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }

  return {
    days: buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      value: counts.get(bucket.key)!,
    })),
    totalCount: meals.length,
  };
}

export function getRecordDistributionData(
  timestamps: string[],
): DistributionData {
  const counts: Record<RecordPeriod, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
  };

  for (const timestamp of timestamps) {
    const hour = new Date(timestamp).getHours();
    if (hour >= 5 && hour < 12) counts.morning += 1;
    else if (hour >= 12 && hour < 18) counts.afternoon += 1;
    else counts.evening += 1;
  }

  return {
    items: DISTRIBUTION_ORDER.map((period) => ({
      period,
      label: DISTRIBUTION_LABELS[period],
      count: counts[period],
    })),
    total: timestamps.length,
  };
}
