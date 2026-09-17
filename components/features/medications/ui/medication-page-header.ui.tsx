"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { ReactNode } from "react";

type MedicationPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
};

export function MedicationPageHeader({
  title,
  description,
  action,
  periodValue,
  onPeriodChange,
}: MedicationPageHeaderProps) {
  return (
    <>
      <PageHeader title={title} description={description} action={action} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <PeriodFilter value={periodValue} onChange={onPeriodChange} />
      </div>
    </>
  );
}