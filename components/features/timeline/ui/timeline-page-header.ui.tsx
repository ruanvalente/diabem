"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodRangeFilter } from "@/components/shared/period-range-filter";
import { MultiOptionPills } from "@/components/shared/multi-option-pills";
import type { PeriodSelection } from "@/lib/date";
import type { TimelineEventType } from "@/lib/health/types";

type TimelinePageHeaderProps = {
  selection: PeriodSelection;
  onSelectionChange: (selection: PeriodSelection) => void;
  typeOptions: { value: TimelineEventType; label: string }[];
  selectedTypes: TimelineEventType[];
  onTypesChange: (types: TimelineEventType[]) => void;
};

export function TimelinePageHeader({
  selection,
  onSelectionChange,
  typeOptions,
  selectedTypes,
  onTypesChange,
}: TimelinePageHeaderProps) {
  return (
    <>
      <PageHeader
        title="Linha do tempo"
        description="Todos os seus registros em um só lugar"
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <MultiOptionPills
          options={typeOptions}
          value={selectedTypes}
          onChange={onTypesChange}
        />
        <PeriodRangeFilter value={selection} onChange={onSelectionChange} />
      </div>
    </>
  );
}