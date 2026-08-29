import type { Activity, GlucoseReading, Meal, Note } from "@/lib/db/types";
import type { DashboardSummary } from "./types";

type DashboardRecords = {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  notes: Note[];
};

type Range = { from?: string; to?: string };

export function buildDashboardSummary(
  records: DashboardRecords,
  range: Range = {},
): DashboardSummary {
  const totalMinutes = records.activities.reduce(
    (acc, activity) => acc + activity.durationMinutes,
    0,
  );

  return {
    period: { start: range.from, end: range.to },
    glucose: {
      count: records.glucose.length,
      latest: records.glucose[0],
    },
    meals: {
      count: records.meals.length,
    },
    activities: {
      count: records.activities.length,
      totalMinutes,
    },
    notes: {
      count: records.notes.length,
    },
    totalRecords:
      records.glucose.length +
      records.meals.length +
      records.activities.length +
      records.notes.length,
  };
}

export function getRecentRecords(
  records: DashboardRecords,
  limitPerType = 5,
): {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  notes: Note[];
} {
  return {
    glucose: records.glucose.slice(0, limitPerType),
    meals: records.meals.slice(0, limitPerType),
    activities: records.activities.slice(0, limitPerType),
    notes: records.notes.slice(0, limitPerType),
  };
}
