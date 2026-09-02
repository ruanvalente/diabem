"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { OptionPills } from "@/components/shared/option-pills";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { Meal } from "@/lib/db/types";
import type { ReactNode } from "react";

type MealPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  typeOptions: { value: Meal["type"]; label: string }[];
  typeValue: Meal["type"] | null;
  onTypeChange: (value: Meal["type"] | undefined) => void;
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
};

export function MealPageHeader({
  title,
  description,
  action,
  typeOptions,
  typeValue,
  onTypeChange,
  periodValue,
  onPeriodChange,
}: MealPageHeaderProps) {
  return (
    <>
      <PageHeader title={title} description={description} action={action} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <OptionPills
          aria-label="Filtrar por tipo de refeição"
          options={typeOptions}
          value={typeValue}
          onChange={onTypeChange}
        />
        <PeriodFilter value={periodValue} onChange={onPeriodChange} />
      </div>
    </>
  );
}
