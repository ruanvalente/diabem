"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { OptionPills } from "@/components/shared/option-pills";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { TimelineEventType } from "@/lib/health/types";

type TimelinePageHeaderProps = {
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
  typeOptions: { value: TimelineEventType; label: string }[];
  typeValue: TimelineEventType | null;
  onTypeChange: (value: TimelineEventType | undefined) => void;
};

export function TimelinePageHeader({
  periodValue,
  onPeriodChange,
  typeOptions,
  typeValue,
  onTypeChange,
}: TimelinePageHeaderProps) {
  return (
    <>
      <PageHeader
        title="Linha do tempo"
        description="Todos os seus registros em um só lugar"
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <OptionPills
          options={typeOptions}
          value={typeValue}
          onChange={onTypeChange}
        />
        <PeriodFilter value={periodValue} onChange={onPeriodChange} />
      </div>
    </>
  );
}
