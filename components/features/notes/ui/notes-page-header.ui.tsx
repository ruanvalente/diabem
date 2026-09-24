"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";

type NotesPageHeaderProps = {
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
};

export function NotesPageHeader({
  periodValue,
  onPeriodChange,
}: NotesPageHeaderProps) {
  return (
    <PageHeader
      title="Observações"
      description="Notas rápidas e livres"
      action={<PeriodFilter value={periodValue} onChange={onPeriodChange} />}
    />
  );
}
