"use client";

import { useEffect, useMemo, useState } from "react";
import type { GlucoseReading } from "@/lib/db/types";
import {
  periodAdverbial,
  resolvePeriodSelectionRange,
  type PeriodSelection,
} from "@/lib/date";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useMedications } from "@/lib/health/hooks/use-medications";
import type { GlucoseRangeInfo } from "@/lib/health/glucose-range";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import type { DataQuality } from "@/lib/intelligence/types/analytics.types";
import type { Insight } from "@/lib/intelligence/types/insight.types";
import type { ChartCard, RecentRecord, SummaryCard } from "../types";
import {
  buildDashboardCharts,
  buildDashboardSubtitle,
  buildRecentRecords,
  buildSummaryCards,
  getLastReadingInfo,
} from "../widget/dashboard.data";

/**
 * Everything the dashboard widget needs to render, derived from the selected
 * period: the selection state, the loading/error status and the view models
 * (summary, charts, recent records, last reading, intelligence analysis).
 */
export type UseDashboardDataResult = {
  selection: PeriodSelection;
  setSelection: (selection: PeriodSelection) => void;
  subtitle: string;
  adverbial: string;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  lastGlucose?: GlucoseReading;
  lastReadingInfo: GlucoseRangeInfo | null;
  glucoseCount: number;
  summaryCards: SummaryCard[];
  charts: { cards: ChartCard[]; hasData: boolean };
  recentRecords: RecentRecord[];
  dataQuality?: DataQuality;
  insights: Insight[];
};

/**
 * Loads and derives everything the dashboard needs to render: the period
 * selection (kept in sync with the calendar), the period-scoped health
 * records, the derived view models (summary, charts, recent records, last
 * reading) and the intelligence analysis of the selected period.
 */
export function useDashboardData(userId: string | null): UseDashboardDataResult {
  const [selection, setSelection] = useState<PeriodSelection>({
    period: "today",
    custom: null,
  });

  const [range, setRange] = useState(() =>
    resolvePeriodSelectionRange(selection),
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

  const data = useMemo(
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

  const adverbial = periodAdverbial(selection);

  const summaryCards = useMemo(
    () => buildSummaryCards(data, adverbial),
    [data, adverbial],
  );
  const charts = useMemo(() => buildDashboardCharts(data, range), [data, range]);
  const recentRecords = useMemo(() => buildRecentRecords(data), [data]);

  const lastGlucose = glucose.records[0];
  const lastReadingInfo = useMemo(
    () => getLastReadingInfo(lastGlucose),
    [lastGlucose],
  );

  /** Re-fetches every record type scoped to the current period. */
  const reload = () => {
    void glucose.reload();
    void meals.reload();
    void activities.reload();
    void notes.reload();
    void medications.reload();
  };

  return {
    selection,
    setSelection,
    subtitle: buildDashboardSubtitle(selection),
    adverbial,
    isLoading,
    error,
    reload,
    lastGlucose,
    lastReadingInfo,
    glucoseCount: glucose.records.length,
    summaryCards,
    charts,
    recentRecords,
    dataQuality: intelligence.result?.analytics.dataQuality,
    insights: intelligence.insights,
  };
}