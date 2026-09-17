"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useMedications } from "@/lib/health/hooks/use-medications";
import {
  resolvePeriodSelectionRange,
  type PeriodSelection,
} from "@/lib/date";
import {
  computeGlucoseStatistics,
  computeActivityStatistics,
  computeMealStatistics,
  computeNoteStatistics,
  computeMedicationStatistics,
  type GlucoseStatistics,
  type ActivityStatistics,
  type MealStatistics,
  type NoteStatistics,
  type MedicationStatistics,
} from "@/lib/analytics/statistics";

export type StatisticsData = {
  glucose: GlucoseStatistics;
  activity: ActivityStatistics;
  meals: MealStatistics;
  notes: NoteStatistics;
  medications: MedicationStatistics;
};

export type UseStatisticsResult = {
  data: StatisticsData;
  isLoading: boolean;
  error: string | null;
  selection: PeriodSelection;
  setSelection: (selection: PeriodSelection) => void;
  medicationFilter: string;
  setMedicationFilter: (value: string) => void;
  medicationNames: string[];
  reload: () => void;
};

export function useStatistics(): UseStatisticsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [selection, setSelection] = useState<PeriodSelection>({
    period: "month",
    custom: null,
  });

  const [medicationFilter, setMedicationFilter] = useState<string>("all");

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
  const medications = useMedications(userId, range);

  useEffect(() => {
    if (!userId) return;
    void glucose.applyFilters(range);
    void meals.applyFilters(range);
    void activities.applyFilters(range);
    void notes.applyFilters(range);
    void medications.applyFilters(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial filter sync
  }, [userId, range]);

  const isLoading =
    glucose.isLoading ||
    meals.isLoading ||
    activities.isLoading ||
    notes.isLoading ||
    medications.isLoading;
  const error =
    glucose.error ??
    meals.error ??
    activities.error ??
    notes.error ??
    medications.error;

  const medicationNames = useMemo(
    () =>
      [...new Set(medications.records.map((record) => record.name))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [medications.records]
  );

  // If the current filter no longer exists in the period, silently treat it as
  // "all" without resetting the state (avoiding lint-prohibited setState inside
  // an effect).
  const effectiveFilter =
    medicationFilter === "all" ||
    medicationNames.includes(medicationFilter)
      ? medicationFilter
      : "all";

  const medicationRecords = useMemo(
    () =>
      effectiveFilter === "all"
        ? medications.records
        : medications.records.filter(
            (record) => record.name === effectiveFilter
          ),
    [medications.records, effectiveFilter]
  );

  const data = useMemo<StatisticsData>(
    () => ({
      glucose: computeGlucoseStatistics(glucose.records),
      activity: computeActivityStatistics(activities.records, range),
      meals: computeMealStatistics(meals.records),
      notes: computeNoteStatistics(notes.records),
      medications: computeMedicationStatistics(medicationRecords),
    }),
    [
      glucose.records,
      activities.records,
      range,
      meals.records,
      notes.records,
      medicationRecords,
    ]
  );

  const reload = () => {
    void glucose.reload();
    void meals.reload();
    void activities.reload();
    void notes.reload();
    void medications.reload();
  };

  return {
    data,
    isLoading,
    error,
    selection,
    setSelection,
    medicationFilter: effectiveFilter,
    setMedicationFilter,
    medicationNames,
    reload,
  };
}
