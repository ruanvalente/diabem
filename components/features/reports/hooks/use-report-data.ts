"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMedications } from "@/lib/health/hooks/use-medications";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import type { AnalysisPeriod } from "@/lib/intelligence/types/analytics.types";
import { insightStrings, type ReportSourceRecords } from "@/lib/reports";
import type { PeriodSelection } from "@/lib/date";
import { usePeriodRange } from "./use-period-range";

const DEFAULT_PERIOD: PeriodSelection = { period: "week", custom: null };

export type UseReportDataResult = {
  period: PeriodSelection;
  setPeriod: (next: PeriodSelection) => void;
  /** Records of the selected period, grouped per report source. */
  records: ReportSourceRecords;
  /** Insights for the selected period, flattened to displayable strings. */
  insights: string[];
  /** Resolved period bounds, or null when the range is open (e.g. "all"). */
  analysisPeriod: AnalysisPeriod | null;
  isLoading: boolean;
  error: string | null;
  /** Re-reads every source for the current period. */
  reload: () => void;
};

/**
 * Collects the health records of the selected period so a report can be
 * generated from them. Owns the period selection, the per-source filtering and
 * the aggregate loading/error state of the feature.
 */
export function useReportData(): UseReportDataResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodSelection>(DEFAULT_PERIOD);
  const range = usePeriodRange(period);

  const glucose = useGlucose(userId, range);
  const meals = useMeals(userId, range);
  const activities = useActivities(userId, range);
  const notes = useNotes(userId, range);
  const medications = useMedications(userId, range);

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

  const analysisPeriod = useMemo(() => {
    if (!range.from || !range.to) return null;
    return { start: range.from, end: range.to };
  }, [range]);

  const intelligence = useIntelligence({
    glucose: glucose.records,
    meals: meals.records,
    activities: activities.records,
    notes: notes.records,
    period: analysisPeriod,
    enabled: !!analysisPeriod && !isLoading,
  });

  const records = useMemo<ReportSourceRecords>(
    () => ({
      glucose: glucose.records,
      meals: meals.records,
      activities: activities.records,
      notes: notes.records,
      medications: medications.records,
    }),
    [
      glucose.records,
      meals.records,
      activities.records,
      notes.records,
      medications.records,
    ],
  );

  const insights = useMemo(
    () => insightStrings(intelligence.insights),
    [intelligence.insights],
  );

  const reload = () => {
    void glucose.reload();
    void meals.reload();
    void activities.reload();
    void notes.reload();
    void medications.reload();
  };

  return {
    period,
    setPeriod,
    records,
    insights,
    analysisPeriod,
    isLoading,
    error,
    reload,
  };
}
