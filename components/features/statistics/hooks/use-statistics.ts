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

/**
 * Loads the health records of the selected period and derives the statistics
 * rendered by the statistics tabs.
 *
 * Owns the period selection, the medication filter and the aggregation of the
 * loading/error status across the five record sources. The resolved date range
 * is recomputed on window focus and tab visibility changes, so relative
 * periods stay current.
 *
 * When the selected medication no longer exists in the period, the exposed
 * `medicationFilter` falls back to "all". The stored selection is intentionally
 * left untouched instead of being reset, to avoid a `setState` inside an
 * effect: it is recovered automatically once the medication is selectable
 * again.
 */
export function useStatistics(): UseStatisticsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [selection, setSelection] = useState<PeriodSelection>({
    period: "month",
    custom: null,
  });

  const [selectedMedication, setSelectedMedication] = useState<string>("all");

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

  const entities = [glucose, meals, activities, notes, medications];

  const glucoseFilters = glucose.applyFilters;
  const mealsFilters = meals.applyFilters;
  const activitiesFilters = activities.applyFilters;
  const notesFilters = notes.applyFilters;
  const medicationsFilters = medications.applyFilters;

  useEffect(() => {
    if (!userId) return;
    void glucoseFilters(range);
    void mealsFilters(range);
    void activitiesFilters(range);
    void notesFilters(range);
    void medicationsFilters(range);
  }, [
    userId,
    range,
    glucoseFilters,
    mealsFilters,
    activitiesFilters,
    notesFilters,
    medicationsFilters,
  ]);

  const isLoading = entities.some((entity) => entity.isLoading);
  const error = entities.find((entity) => entity.error)?.error ?? null;

  const medicationNames = useMemo(
    () =>
      [...new Set(medications.records.map((record) => record.name))].sort(
        (a, b) => a.localeCompare(b, "pt-BR")
      ),
    [medications.records]
  );

  const medicationFilter =
    selectedMedication === "all" || medicationNames.includes(selectedMedication)
      ? selectedMedication
      : "all";

  const medicationRecords = useMemo(
    () =>
      medicationFilter === "all"
        ? medications.records
        : medications.records.filter(
            (record) => record.name === medicationFilter
          ),
    [medications.records, medicationFilter]
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
    for (const entity of entities) void entity.reload();
  };

  return {
    data,
    isLoading,
    error,
    selection,
    setSelection,
    medicationFilter,
    setMedicationFilter: setSelectedMedication,
    medicationNames,
    reload,
  };
}
