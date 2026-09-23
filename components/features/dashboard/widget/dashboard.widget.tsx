"use client";

import { useAuth } from "@/lib/auth/use-auth";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { QUICK_ACTIONS } from "./dashboard.data";
import { DashboardHeader } from "../ui/dashboard-header.ui";
import { QuickActions } from "../ui/quick-actions.ui";
import { LastReadingCard } from "../ui/last-reading-card.ui";
import { DaySummaryList } from "../ui/day-summary-list.ui";
import { DashboardChartsSection } from "../ui/dashboard-charts-section.ui";
import { RecentRecords } from "../ui/recent-records.ui";
import { InsightsSection } from "../ui/insights-section.ui";
import { InsightDetails } from "../ui/insight-details.ui";
import { QualityIndicator } from "../ui/quality-indicator.ui";

export function DashboardWidget() {
  const { user } = useAuth();
  const dashboard = useDashboardData(user?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <DashboardHeader
        userName={user?.name}
        subtitle={dashboard.subtitle}
        action={
          <PeriodRangeFilter
            value={dashboard.selection}
            onChange={dashboard.setSelection}
          />
        }
      />

      {dashboard.isLoading ? (
        <ListSkeleton rows={3} />
      ) : dashboard.error ? (
        <ErrorState message={dashboard.error} onRetry={dashboard.reload} />
      ) : (
        <div className="space-y-8">
          <LastReadingCard
            reading={dashboard.lastGlucose}
            rangeInfo={dashboard.lastReadingInfo}
            count={dashboard.glucoseCount}
            periodLabel={dashboard.adverbial}
          />
          <QuickActions actions={QUICK_ACTIONS} />
          <DaySummaryList
            cards={dashboard.summaryCards}
            title="Resumo do período"
          />
          {dashboard.dataQuality && (
            <QualityIndicator quality={dashboard.dataQuality} />
          )}
          {dashboard.insights.length > 0 && (
            <InsightsSection
              insights={dashboard.insights}
              renderCardAction={(insight) => (
                <InsightDetails insight={insight} />
              )}
            />
          )}
          <DashboardChartsSection
            cards={dashboard.charts.cards}
            hasData={dashboard.charts.hasData}
          />
          <RecentRecords items={dashboard.recentRecords} />
        </div>
      )}
    </div>
  );
}