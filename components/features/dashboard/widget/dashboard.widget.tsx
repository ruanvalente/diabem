"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useTodayRange } from "../hooks/use-today-range";
import {
  buildSummaryCards,
  getLastReadingInfo,
  QUICK_ACTIONS,
} from "./dashboard.data";
import { DashboardHeader } from "../ui/dashboard-header.ui";
import { QuickActions } from "../ui/quick-actions.ui";
import { LastReadingCard } from "../ui/last-reading-card.ui";
import { DaySummaryList } from "../ui/day-summary-list.ui";

export function DashboardWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const glucose = useGlucose(userId);
  const meals = useMeals(userId);
  const activities = useActivities(userId);
  const notes = useNotes(userId);

  const todayRange = useTodayRange();

  const glucoseFilters = glucose.applyFilters;
  const mealsFilters = meals.applyFilters;
  const activitiesFilters = activities.applyFilters;
  const notesFilters = notes.applyFilters;

  useEffect(() => {
    if (!userId) return;
    void glucoseFilters(todayRange);
    void mealsFilters(todayRange);
    void activitiesFilters(todayRange);
    void notesFilters(todayRange);
  }, [
    userId,
    todayRange,
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
  const error = glucose.error ?? meals.error ?? activities.error ?? notes.error;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        <ErrorState
          message={error}
          onRetry={() => {
            void glucose.reload();
            void meals.reload();
            void activities.reload();
            void notes.reload();
          }}
        />
      </div>
    );
  }

  const lastGlucose = glucose.records[0];
  const lastGlucoseRange = getLastReadingInfo(lastGlucose);

  const summaryCards = buildSummaryCards({
    glucose: glucose.records,
    meals: meals.records,
    activities: activities.records,
    notes: notes.records,
  });

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <DashboardHeader userName={user?.name} />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <LastReadingCard
            reading={lastGlucose}
            rangeInfo={lastGlucoseRange}
            count={glucose.records.length}
          />
          <QuickActions actions={QUICK_ACTIONS} />
          <DaySummaryList cards={summaryCards} />
        </>
      )}
    </div>
  );
}
