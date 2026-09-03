"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import {
  resolvePeriodSelectionRange,
  type PeriodSelection,
} from "@/lib/date";
import {
  computeGlucoseStatistics,
  computeActivityStatistics,
  computeMealStatistics,
  computeNoteStatistics,
  type GlucoseStatistics,
  type ActivityStatistics,
  type MealStatistics,
  type NoteStatistics,
} from "@/lib/analytics/statistics";

export type StatisticsData = {
  glucose: GlucoseStatistics;
  activity: ActivityStatistics;
  meals: MealStatistics;
  notes: NoteStatistics;
};

export type UseStatisticsResult = {
  data: StatisticsData;
  isLoading: boolean;
  error: string | null;
  selection: PeriodSelection;
  setSelection: (selection: PeriodSelection) => void;
  reload: () => void;
};

export function useStatistics(): UseStatisticsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [selection, setSelection] = useState<PeriodSelection>({
    period: "month",
    custom: null,
  });

  const [range, setRange] = useState(() =>
    resolvePeriodSelectionRange(selection)
  );

  useEffect(() => {
    const refresh = () => setRange(resolvePeriodSelectionRange(selection));
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [selection]);

  const glucose = useGlucose(userId, range);
  const meals = useMeals(userId, range);
  const activities = useActivities(userId, range);
  const notes = useNotes(userId, range);

  useEffect(() => {
    if (!userId) return;
    void glucose.applyFilters(range);
    void meals.applyFilters(range);
    void activities.applyFilters(range);
    void notes.applyFilters(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial filter sync
  }, [userId, range]);

  const isLoading =
    glucose.isLoading || meals.isLoading || activities.isLoading || notes.isLoading;
  const error =
    glucose.error ?? meals.error ?? activities.error ?? notes.error;

  const data = useMemo<StatisticsData>(
    () => ({
      glucose: computeGlucoseStatistics(glucose.records),
      activity: computeActivityStatistics(activities.records, range),
      meals: computeMealStatistics(meals.records),
      notes: computeNoteStatistics(notes.records),
    }),
    [glucose.records, activities.records, range, meals.records, notes.records]
  );

  const reload = () => {
    void glucose.reload();
    void meals.reload();
    void activities.reload();
    void notes.reload();
  };

  return {
    data,
    isLoading,
    error,
    selection,
    setSelection,
    reload,
  };
}
