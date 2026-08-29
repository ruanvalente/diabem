"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useTimeline } from "@/lib/health/hooks/use-timeline";
import { TimelineList } from "@/components/features/timeline/timeline-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { TIMELINE_EVENT_LABELS } from "@/lib/health/constants";
import { resolvePeriodRange, type PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { TimelineEventType } from "@/lib/health/types";
import { History } from "lucide-react";
import { TimelinePageHeader } from "../ui/timeline-page-header.ui";

const TYPE_OPTIONS: { value: TimelineEventType; label: string }[] = [
  { value: "glucose", label: TIMELINE_EVENT_LABELS.glucose },
  { value: "meal", label: TIMELINE_EVENT_LABELS.meal },
  { value: "activity", label: TIMELINE_EVENT_LABELS.activity },
  { value: "note", label: TIMELINE_EVENT_LABELS.note },
];

export function TimelineWidget() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [period, setPeriod] = useState<PeriodFilterValue>("week");
  const [type, setType] = useState<TimelineEventType | undefined>(undefined);

  const baseFilter = useMemo(() => resolvePeriodRange(period), [period]);

  const timeline = useTimeline(userId, baseFilter);
  const { records, isLoading, error, reload, applyFilters } = timeline;

  const handlePeriodChange = (next: PeriodFilterValue) => {
    setPeriod(next);
    void applyFilters({ ...resolvePeriodRange(next), type });
  };

  const handleTypeChange = (next: TimelineEventType | undefined) => {
    setType(next);
    void applyFilters({ ...baseFilter, type: next });
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <TimelinePageHeader
        periodValue={period}
        onPeriodChange={handlePeriodChange}
        typeOptions={TYPE_OPTIONS}
        typeValue={type ?? null}
        onTypeChange={handleTypeChange}
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : (
        <TimelineList
          events={records}
          emptyState={
            <EmptyState
              icon={History}
              title="Nada por aqui ainda"
              description="Seus registros de glicemia, refeições, atividades e observações vão aparecer aqui em ordem cronológica."
            />
          }
        />
      )}
    </div>
  );
}
