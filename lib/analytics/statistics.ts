import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import type { GlucoseContext } from "@/lib/db/types";
import {
  GLUCOSE_CONTEXT_LABELS,
  GLUCOSE_CONTEXT_ORDER,
  MEAL_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/health/constants";
import { getGlucoseRange, GLUCOSE_RANGE_LABELS } from "@/lib/health/glucose-range";
import { calculateBasicStats } from "@/lib/intelligence/analytics/statistics";
import { calculateTrend } from "@/lib/intelligence/analytics/trend";
import type {
  GlucoseChartData,
  DistributionData,
  ActivityChartData,
  DayValue,
} from "./types";

export type GlucoseContextDistribution = {
  context: GlucoseContext;
  label: string;
  count: number;
};

export type GlucoseRangeDistribution = {
  range: "low" | "in_range" | "high" | "very_high";
  label: string;
  count: number;
  percentage: number;
};

export type GlucoseStatistics = {
  count: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  inRangePercentage: number | null;
  trendDirection: string;
  trendLabel: string;
  contextDistribution: GlucoseContextDistribution[];
  rangeDistribution: GlucoseRangeDistribution[];
  chartData: GlucoseChartData;
  distributionByTimeOfDay: DistributionData;
  hasEnoughData: boolean;
};

export type ActivityStatistics = {
  totalCount: number;
  totalMinutes: number;
  averageMinutesPerDay: number | null;
  byType: { type: string; label: string; count: number; totalMinutes: number }[];
  chartData: ActivityChartData;
  hasEnoughData: boolean;
};

export type MealStatistics = {
  totalCount: number;
  byType: { type: string; label: string; count: number }[];
  distributionByTimeOfDay: DistributionData;
  hasEnoughData: boolean;
};

export type NoteStatistics = {
  totalCount: number;
  hasEnoughData: boolean;
};

const MIN_GLUCOSE_FOR_STATS = 2;

function computeGlucoseContextDistribution(
  readings: GlucoseReading[]
): GlucoseContextDistribution[] {
  const counts = new Map<GlucoseContext, number>();
  for (const reading of readings) {
    counts.set(reading.context, (counts.get(reading.context) ?? 0) + 1);
  }

  return GLUCOSE_CONTEXT_ORDER
    .filter((ctx) => (counts.get(ctx) ?? 0) > 0)
    .map((context) => ({
      context,
      label: GLUCOSE_CONTEXT_LABELS[context],
      count: counts.get(context) ?? 0,
    }));
}

function computeGlucoseRangeDistribution(
  readings: GlucoseReading[]
): GlucoseRangeDistribution[] {
  if (readings.length === 0) return [];

  const counts = new Map<string, number>();
  for (const reading of readings) {
    const range = getGlucoseRange(reading.value);
    counts.set(range, (counts.get(range) ?? 0) + 1);
  }

  const total = readings.length;
  return (["low", "in_range", "high", "very_high"] as const)
    .filter((range) => (counts.get(range) ?? 0) > 0)
    .map((range) => ({
      range,
      label: GLUCOSE_RANGE_LABELS[range],
      count: counts.get(range) ?? 0,
      percentage: Math.round(((counts.get(range) ?? 0) / total) * 100),
    }));
}

function computeInRangePercentage(readings: GlucoseReading[]): number | null {
  if (readings.length === 0) return null;
  const inRange = readings.filter((r) => getGlucoseRange(r.value) === "in_range");
  return Math.round((inRange.length / readings.length) * 100);
}

function computeTrendLabel(direction: string): string {
  switch (direction) {
    case "increasing":
      return "Crescente";
    case "decreasing":
      return "Decrescente";
    case "stable":
      return "Estável";
    default:
      return "Insuficiente";
  }
}

function buildGlucoseDistributionByTimeOfDay(
  readings: GlucoseReading[]
): DistributionData {
  const counts = { morning: 0, afternoon: 0, evening: 0 };
  for (const reading of readings) {
    const hour = new Date(reading.measuredAt).getHours();
    if (hour >= 5 && hour < 12) counts.morning += 1;
    else if (hour >= 12 && hour < 18) counts.afternoon += 1;
    else counts.evening += 1;
  }

  return {
    items: [
      { period: "morning" as const, label: "Manhã", count: counts.morning },
      { period: "afternoon" as const, label: "Tarde", count: counts.afternoon },
      { period: "evening" as const, label: "Noite", count: counts.evening },
    ],
    total: readings.length,
  };
}

function buildActivityChartData(
  activities: Activity[],
  range: { from?: string; to?: string }
): ActivityChartData {
  const MAX_CHART_DAYS = 31;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upperBound = range.to ? new Date(range.to) : new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const end = range.to ? new Date(upperBound.getFullYear(), upperBound.getMonth(), upperBound.getDate()) : today;
  const lastInclusive = range.to ? new Date(end.getTime() - 24 * 60 * 60 * 1000) : today;

  let start = range.from
    ? new Date(new Date(range.from).getFullYear(), new Date(range.from).getMonth(), new Date(range.from).getDate())
    : new Date(lastInclusive.getTime() - (MAX_CHART_DAYS - 1) * 24 * 60 * 60 * 1000);
  const minStart = new Date(lastInclusive.getTime() - (MAX_CHART_DAYS - 1) * 24 * 60 * 60 * 1000);
  if (start.getTime() < minStart.getTime()) start = minStart;

  const buckets: DayValue[] = [];
  const totals = new Map<string, number>();
  for (let d = new Date(start); d.getTime() <= lastInclusive.getTime(); d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    totals.set(key, 0);
    const isToday = d.getTime() === today.getTime();
    const isYesterday = d.getTime() === today.getTime() - 24 * 60 * 60 * 1000;
    const label = isToday
      ? "Hoje"
      : isYesterday
        ? "Ontem"
        : d.toLocaleDateString("pt-BR", { weekday: "short" });
    buckets.push({ key, label, value: 0 });
  }

  let totalMinutes = 0;
  for (const activity of activities) {
    const startedAt = new Date(activity.startedAt);
    const dayStart = new Date(startedAt.getFullYear(), startedAt.getMonth(), startedAt.getDate()).getTime();
    const boundsFrom = start.getTime();
    const boundsTo = lastInclusive.getTime();
    if (dayStart < boundsFrom || dayStart > boundsTo) continue;
    totalMinutes += activity.durationMinutes;
    const key = `${startedAt.getFullYear()}-${String(startedAt.getMonth() + 1).padStart(2, "0")}-${String(startedAt.getDate()).padStart(2, "0")}`;
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + activity.durationMinutes);
    }
  }

  return {
    days: buckets.map((bucket) => ({
      ...bucket,
      value: totals.get(bucket.key) ?? 0,
    })),
    totalMinutes,
  };
}

function buildMealDistributionByTimeOfDay(meals: Meal[]): DistributionData {
  const counts = { morning: 0, afternoon: 0, evening: 0 };
  for (const meal of meals) {
    const hour = new Date(meal.consumedAt).getHours();
    if (hour >= 5 && hour < 12) counts.morning += 1;
    else if (hour >= 12 && hour < 18) counts.afternoon += 1;
    else counts.evening += 1;
  }

  return {
    items: [
      { period: "morning" as const, label: "Manhã", count: counts.morning },
      { period: "afternoon" as const, label: "Tarde", count: counts.afternoon },
      { period: "evening" as const, label: "Noite", count: counts.evening },
    ],
    total: meals.length,
  };
}

export function computeGlucoseStatistics(
  readings: GlucoseReading[]
): GlucoseStatistics {
  const values = readings.map((r) => r.value);
  const stats = calculateBasicStats(values);
  const trend = calculateTrend(values);

  return {
    count: stats.count,
    average: stats.average ?? null,
    minimum: stats.minimum ?? null,
    maximum: stats.maximum ?? null,
    inRangePercentage: computeInRangePercentage(readings),
    trendDirection: trend.direction,
    trendLabel: computeTrendLabel(trend.direction),
    contextDistribution: computeGlucoseContextDistribution(readings),
    rangeDistribution: computeGlucoseRangeDistribution(readings),
    chartData: {
      points: readings
        .slice()
        .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
        .map((r) => ({
          key: r.id,
          label: new Date(r.measuredAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }),
          value: r.value,
        })),
      count: stats.count,
      average: stats.average ?? null,
      minimum: stats.minimum ?? null,
      maximum: stats.maximum ?? null,
    },
    distributionByTimeOfDay: buildGlucoseDistributionByTimeOfDay(readings),
    hasEnoughData: stats.count >= MIN_GLUCOSE_FOR_STATS,
  };
}

export function computeActivityStatistics(
  activities: Activity[],
  range: { from?: string; to?: string }
): ActivityStatistics {
  const totalMinutes = activities.reduce((sum, a) => sum + a.durationMinutes, 0);

  const byTypeMap = new Map<string, { count: number; totalMinutes: number }>();
  for (const activity of activities) {
    const existing = byTypeMap.get(activity.type) ?? { count: 0, totalMinutes: 0 };
    existing.count += 1;
    existing.totalMinutes += activity.durationMinutes;
    byTypeMap.set(activity.type, existing);
  }

  const byType = [...byTypeMap.entries()].map(([type, data]) => ({
    type,
    label: ACTIVITY_TYPE_LABELS[type as keyof typeof ACTIVITY_TYPE_LABELS] ?? type,
    ...data,
  }));

  const daysInRange = range.from && range.to
    ? Math.max(1, Math.ceil((new Date(range.to).getTime() - new Date(range.from).getTime()) / (24 * 60 * 60 * 1000)))
    : 7;

  return {
    totalCount: activities.length,
    totalMinutes,
    averageMinutesPerDay: activities.length > 0 ? Math.round(totalMinutes / daysInRange) : null,
    byType,
    chartData: buildActivityChartData(activities, range),
    hasEnoughData: activities.length > 0,
  };
}

export function computeMealStatistics(meals: Meal[]): MealStatistics {
  const byTypeMap = new Map<string, number>();
  for (const meal of meals) {
    byTypeMap.set(meal.type, (byTypeMap.get(meal.type) ?? 0) + 1);
  }

  const byType = [...byTypeMap.entries()].map(([type, count]) => ({
    type,
    label: MEAL_TYPE_LABELS[type as keyof typeof MEAL_TYPE_LABELS] ?? type,
    count,
  }));

  return {
    totalCount: meals.length,
    byType,
    distributionByTimeOfDay: buildMealDistributionByTimeOfDay(meals),
    hasEnoughData: meals.length > 0,
  };
}

export function computeNoteStatistics(notes: Note[]): NoteStatistics {
  return {
    totalCount: notes.length,
    hasEnoughData: notes.length > 0,
  };
}
