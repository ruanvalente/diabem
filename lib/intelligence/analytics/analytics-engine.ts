import type {
  AnalysisPeriod,
  DataQuality,
  IntelligenceAnalytics,
  MealGlucoseRelation,
  ActivityGlucoseRelation,
} from "../types/analytics.types";
import type { GlucoseReading, Meal, Activity } from "@/lib/db/types";
import { calculateBasicStats, calculateCoefficientOfVariation } from "./statistics";
import { groupByTimeOfDay } from "./time-slots";
import { calculateTrend } from "./trend";

const MEAL_BEFORE_MINUTES = 60;
const MEAL_AFTER_MINUTES = 120;
const ACTIVITY_BEFORE_MINUTES = 60;
const ACTIVITY_AFTER_MINUTES = 180;

function computeGlucoseAnalytics(glucose: GlucoseReading[]) {
  if (glucose.length === 0) return undefined;

  const values = glucose.map((r) => r.value);
  const stats = calculateBasicStats(values);
  const byTimeOfDay = groupByTimeOfDay(
    glucose.map((r) => ({ timestamp: r.measuredAt, value: r.value }))
  );

  return { stats, byTimeOfDay };
}

function computeMealAnalytics(meals: Meal[]) {
  if (meals.length === 0) return undefined;

  const byTypeMap = new Map<string, number>();
  for (const meal of meals) {
    byTypeMap.set(meal.type, (byTypeMap.get(meal.type) ?? 0) + 1);
  }

  return {
    totalCount: meals.length,
    byType: [...byTypeMap.entries()].map(([type, count]) => ({ type, count })),
  };
}

function computeActivityAnalytics(activities: Activity[]) {
  if (activities.length === 0) return undefined;

  const byTypeMap = new Map<string, { count: number; totalMinutes: number }>();
  let totalMinutes = 0;

  for (const activity of activities) {
    totalMinutes += activity.durationMinutes;
    const existing = byTypeMap.get(activity.type) ?? { count: 0, totalMinutes: 0 };
    existing.count += 1;
    existing.totalMinutes += activity.durationMinutes;
    byTypeMap.set(activity.type, existing);
  }

  return {
    totalCount: activities.length,
    totalMinutes,
    byType: [...byTypeMap.entries()].map(([type, data]) => ({
      type,
      ...data,
    })),
  };
}

function computeDataQuality(
  glucose: GlucoseReading[],
  meals: Meal[],
  activities: Activity[],
  period: AnalysisPeriod
): DataQuality {
  const totalRecords = glucose.length + meals.length + activities.length;

  let missingValues = 0;
  for (const r of glucose) {
    if (r.value === undefined || r.value === null) missingValues++;
  }

  const glucoseIds = new Set(glucose.map((r) => r.id));
  let duplicatedRecords = 0;
  for (const r of glucose) {
    if (glucoseIds.has(r.id)) glucoseIds.delete(r.id);
    else duplicatedRecords++;
  }

  const periodStart = new Date(period.start).getTime();
  const periodEnd = new Date(period.end).getTime();
  const periodMs = periodEnd - periodStart;

  const allTimestamps = [
    ...glucose.map((r) => new Date(r.measuredAt).getTime()),
    ...meals.map((m) => new Date(m.consumedAt).getTime()),
    ...activities.map((a) => new Date(a.startedAt).getTime()),
  ];

  let coveredDays = 0;
  if (allTimestamps.length > 0 && periodMs > 0) {
    const uniqueDays = new Set(
      allTimestamps.map((t) => new Date(t).toDateString())
    );
    const totalDays = Math.ceil(periodMs / (24 * 60 * 60 * 1000));
    coveredDays = Math.min(uniqueDays.size, totalDays);
  }

  const periodCoverage =
    periodMs > 0 ? Math.round((coveredDays / Math.ceil(periodMs / (24 * 60 * 60 * 1000))) * 100) / 100 : 0;

  return {
    totalRecords,
    missingValues,
    duplicatedRecords,
    periodCoverage,
    sufficientForAnalysis: totalRecords >= 10,
  };
}

function computeMealGlucoseRelations(
  meals: Meal[],
  glucoseReadings: GlucoseReading[]
): MealGlucoseRelation[] {
  return meals.map((meal) => {
    const mealTime = new Date(meal.consumedAt).getTime();

    const before = glucoseReadings
      .filter((r) => {
        const diff = mealTime - new Date(r.measuredAt).getTime();
        return diff > 0 && diff <= MEAL_BEFORE_MINUTES * 60 * 1000;
      })
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];

    const after = glucoseReadings
      .filter((r) => {
        const diff = new Date(r.measuredAt).getTime() - mealTime;
        return diff > 0 && diff <= MEAL_AFTER_MINUTES * 60 * 1000;
      })
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())[0];

    const timeDifferenceMinutes =
      before && after
        ? Math.round(
            (new Date(after.measuredAt).getTime() -
              new Date(before.measuredAt).getTime()) /
              60000
          )
        : undefined;

    return {
      mealId: meal.id,
      glucoseBefore: before
        ? { id: before.id, value: before.value, measuredAt: before.measuredAt }
        : undefined,
      glucoseAfter: after
        ? { id: after.id, value: after.value, measuredAt: after.measuredAt }
        : undefined,
      timeDifferenceMinutes,
    };
  });
}

function computeActivityGlucoseRelations(
  activities: Activity[],
  glucoseReadings: GlucoseReading[]
): ActivityGlucoseRelation[] {
  return activities.map((activity) => {
    const activityTime = new Date(activity.startedAt).getTime();
    const activityEnd =
      activityTime + activity.durationMinutes * 60 * 1000;

    const before = glucoseReadings
      .filter((r) => {
        const diff = activityTime - new Date(r.measuredAt).getTime();
        return diff > 0 && diff <= ACTIVITY_BEFORE_MINUTES * 60 * 1000;
      })
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())[0];

    const after = glucoseReadings
      .filter((r) => {
        const diff = new Date(r.measuredAt).getTime() - activityEnd;
        return diff > 0 && diff <= ACTIVITY_AFTER_MINUTES * 60 * 1000;
      })
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())[0];

    const timeDifferenceMinutes =
      before && after
        ? Math.round(
            (new Date(after.measuredAt).getTime() -
              new Date(before.measuredAt).getTime()) /
              60000
          )
        : undefined;

    return {
      activityId: activity.id,
      glucoseBefore: before
        ? { id: before.id, value: before.value, measuredAt: before.measuredAt }
        : undefined,
      glucoseAfter: after
        ? { id: after.id, value: after.value, measuredAt: after.measuredAt }
        : undefined,
      timeDifferenceMinutes,
    };
  });
}

export function computeIntelligenceAnalytics(
  glucose: GlucoseReading[],
  meals: Meal[],
  activities: Activity[],
  period: AnalysisPeriod
): IntelligenceAnalytics {
  const dataQuality = computeDataQuality(glucose, meals, activities, period);

  const glucoseAnalytics = computeGlucoseAnalytics(glucose);
  const mealAnalytics = computeMealAnalytics(meals);
  const activityAnalytics = computeActivityAnalytics(activities);

  const glucoseValues = glucose.map((r) => r.value);
  const glucoseTrend = calculateTrend(glucoseValues);
  const glucoseVariability =
    glucoseValues.length >= 2
      ? {
          standardDeviation:
            glucoseAnalytics?.stats.standardDeviation,
          range:
            glucoseAnalytics?.stats.maximum !== undefined &&
            glucoseAnalytics?.stats.minimum !== undefined
              ? glucoseAnalytics.stats.maximum - glucoseAnalytics.stats.minimum
              : undefined,
          coefficientOfVariation: calculateCoefficientOfVariation(glucoseValues),
        }
      : undefined;

  const mealGlucoseRelations = computeMealGlucoseRelations(meals, glucose);
  const activityGlucoseRelations = computeActivityGlucoseRelations(
    activities,
    glucose
  );

  return {
    period,
    dataQuality,
    glucose: glucoseAnalytics,
    meals: mealAnalytics,
    activities: activityAnalytics,
    glucoseTrend,
    glucoseVariability,
    mealGlucoseRelations,
    activityGlucoseRelations,
  };
}
