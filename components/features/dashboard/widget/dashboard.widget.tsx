"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { useIntelligence } from "@/lib/intelligence/use-intelligence";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import {
  formatPeriodRangeLabel,
  periodAdverbial,
  resolvePeriodSelectionRange,
  type PeriodSelection,
} from "@/lib/date";
import {
  buildDashboardCharts,
  buildRecentRecords,
  buildSummaryCards,
  getLastReadingInfo,
  QUICK_ACTIONS,
} from "./dashboard.data";
import { DashboardHeader } from "../ui/dashboard-header.ui";
import { QuickActions } from "../ui/quick-actions.ui";
import { LastReadingCard } from "../ui/last-reading-card.ui";
import { DaySummaryList } from "../ui/day-summary-list.ui";
import { DashboardChartsSection } from "../ui/dashboard-charts-section.ui";
import { RecentRecords } from "../ui/recent-records.ui";
import { InsightsSection } from "../ui/insights-section.ui";
import { InsightDetails } from "../ui/insight-details.ui";

function getSubtitle(selection: PeriodSelection): string {
  if (selection.period === "custom" && selection.custom) {
    return `Acompanhamento ${formatPeriodRangeLabel(selection.custom)}.`;
  }
  return `Veja como foi seu acompanhamento ${periodAdverbial(selection)}.`;
}

export function DashboardWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

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

  const glucoseFilters = glucose.applyFilters;
  const mealsFilters = meals.applyFilters;
  const activitiesFilters = activities.applyFilters;
  const notesFilters = notes.applyFilters;

  useEffect(() => {
    if (!userId) return;
    void glucoseFilters(range);
    void mealsFilters(range);
    void activitiesFilters(range);
    void notesFilters(range);
  }, [
    userId,
    range,
    glucoseFilters,
    mealsFilters,
    activitiesFilters,
    notesFilters,
  ]);

  const isLoading =
    glucose.isLoading ||
    meals.isLoading ||
    activities.isLoading ||
    notes.isLoading;
  const error =
    glucose.error ?? meals.error ?? activities.error ?? notes.error;

  const data = {
    glucose: glucose.records,
    meals: meals.records,
    activities: activities.records,
    notes: notes.records,
  };

  const analysisPeriod = useMemo(() => {
    if (!range.from || !range.to) return null;
    return { start: range.from, end: range.to };
  }, [range]);

  const intelligence = useIntelligence({
    glucose: data.glucose,
    meals: data.meals,
    activities: data.activities,
    notes: data.notes,
    period: analysisPeriod,
    enabled: !!analysisPeriod && !isLoading,
  });

  const adverbial = periodAdverbial(selection);
  const summaryCards = buildSummaryCards(data, adverbial);
  const charts = buildDashboardCharts(data, range);
  const recentRecords = buildRecentRecords(data);
  const lastGlucose = glucose.records[0];
  const lastGlucoseRange = getLastReadingInfo(lastGlucose);

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <DashboardHeader
        userName={user?.name}
        subtitle={getSubtitle(selection)}
        action={
          <PeriodRangeFilter value={selection} onChange={setSelection} />
        }
      />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            void glucose.reload();
            void meals.reload();
            void activities.reload();
            void notes.reload();
          }}
        />
      ) : (
        <div className="space-y-8">
          <LastReadingCard
            reading={lastGlucose}
            rangeInfo={lastGlucoseRange}
            count={glucose.records.length}
            periodLabel={adverbial}
          />
          <QuickActions actions={QUICK_ACTIONS} />
          <DaySummaryList cards={summaryCards} title="Resumo do período" />
          {!isLoading && intelligence.insights.length > 0 && (
            <InsightsSection
              insights={intelligence.insights}
              renderCardAction={(insight) => (
                <InsightDetails insight={insight} />
              )}
            />
          )}
          <DashboardChartsSection
            cards={charts.cards}
            hasData={charts.hasData}
          />
          <RecentRecords items={recentRecords} />
        </div>
      )}
    </div>
  );
}