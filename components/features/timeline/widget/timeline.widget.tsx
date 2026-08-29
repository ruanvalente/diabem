"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/use-auth";
import { useTimeline } from "@/lib/health/hooks/use-timeline";
import { TimelineList } from "@/components/features/timeline/timeline-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { TIMELINE_EVENT_LABELS } from "@/lib/health/constants";
import { resolvePeriodSelectionRange, type PeriodSelection } from "@/lib/date";
import type {
  TimelineEventType,
  TimelineFilter,
} from "@/lib/health/types";
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

  const [selection, setSelection] = useState<PeriodSelection>({
    period: "week",
    custom: null,
  });
  const [types, setTypes] = useState<TimelineEventType[]>([]);

  const baseFilter = useMemo(
    () => resolvePeriodSelectionRange(selection),
    [selection],
  );

  const timeline = useTimeline(userId, baseFilter);
  const { records, isLoading, error, reload, applyFilters } = timeline;

  const buildFilter = (
    range: { from?: string; to?: string },
    nextTypes: TimelineEventType[],
  ): TimelineFilter => ({
    ...range,
    types: nextTypes.length > 0 ? nextTypes : undefined,
  });

  const handleSelectionChange = (next: PeriodSelection) => {
    setSelection(next);
    void applyFilters(buildFilter(resolvePeriodSelectionRange(next), types));
  };

  const handleTypesChange = (next: TimelineEventType[]) => {
    setTypes(next);
    void applyFilters(buildFilter(baseFilter, next));
  };

  const hasActiveFilters =
    selection.period !== "all" || types.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <TimelinePageHeader
        selection={selection}
        onSelectionChange={handleSelectionChange}
        typeOptions={TYPE_OPTIONS}
        selectedTypes={types}
        onTypesChange={handleTypesChange}
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
              description={
                hasActiveFilters
                  ? "Não há registros para o período e tipos selecionados. Ajuste o filtro para encontrar mais resultados."
                  : "Seus registros de glicemia, refeições, atividades e observações vão aparecer aqui em ordem cronológica."
              }
            />
          }
        />
      )}
    </div>
  );
}