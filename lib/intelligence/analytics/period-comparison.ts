import type {
  PeriodComparison,
  PeriodComparisonResult,
} from "../types/analytics.types";
import type { GlucoseReading, Activity, Meal } from "@/lib/db/types";

function compareNumericValues(
  currentValues: number[],
  previousValues: number[]
): PeriodComparison | undefined {
  if (currentValues.length === 0 || previousValues.length === 0) return undefined;

  const current =
    currentValues.reduce((a, b) => a + b, 0) / currentValues.length;
  const previous =
    previousValues.reduce((a, b) => a + b, 0) / previousValues.length;

  const absoluteDifference = current - previous;
  const percentageDifference =
    previous !== 0
      ? Math.round((absoluteDifference / previous) * 10000) / 100
      : undefined;

  return {
    current: Math.round(current * 100) / 100,
    previous: Math.round(previous * 100) / 100,
    absoluteDifference: Math.round(absoluteDifference * 100) / 100,
    percentageDifference,
  };
}

function compareCounts(current: number, previous: number): PeriodComparison {
  const absoluteDifference = current - previous;
  const percentageDifference =
    previous !== 0
      ? Math.round((absoluteDifference / previous) * 10000) / 100
      : undefined;

  return {
    current,
    previous,
    absoluteDifference,
    percentageDifference,
  };
}

export function compareGlucosePeriods(
  current: GlucoseReading[],
  previous: GlucoseReading[]
): PeriodComparisonResult {
  const currentValues = current.map((r) => r.value);
  const previousValues = previous.map((r) => r.value);

  return {
    average: compareNumericValues(currentValues, previousValues),
    count: compareCounts(currentValues.length, previousValues.length),
    minimum: compareNumericValues(currentValues, previousValues)
      ? {
          current: Math.min(...currentValues),
          previous: Math.min(...previousValues),
          absoluteDifference:
            Math.min(...currentValues) - Math.min(...previousValues),
        }
      : undefined,
    maximum: compareNumericValues(currentValues, previousValues)
      ? {
          current: Math.max(...currentValues),
          previous: Math.max(...previousValues),
          absoluteDifference:
            Math.max(...currentValues) - Math.max(...previousValues),
        }
      : undefined,
  };
}

export function compareActivityPeriods(
  current: Activity[],
  previous: Activity[]
): PeriodComparisonResult {
  const currentMinutes = current.map((a) => a.durationMinutes);
  const previousMinutes = previous.map((a) => a.durationMinutes);

  const currentTotal = currentMinutes.reduce((a, b) => a + b, 0);
  const previousTotal = previousMinutes.reduce((a, b) => a + b, 0);

  return {
    count: compareCounts(current.length, previous.length),
    totalMinutes: compareCounts(currentTotal, previousTotal),
  };
}

export function compareMealPeriods(
  current: Meal[],
  previous: Meal[]
): PeriodComparisonResult {
  return {
    count: compareCounts(current.length, previous.length),
  };
}
