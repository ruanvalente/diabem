"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { OptionPills } from "@/components/shared/option-pills";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { Activity } from "@/lib/db/types";
import type { ReactNode } from "react";

type ActivityPageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  typeOptions: { value: Activity["type"]; label: string }[];
  typeValue: Activity["type"] | null;
  onTypeChange: (value: Activity["type"] | undefined) => void;
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
};

export function ActivityPageHeader({
  title,
  description,
  action,
  typeOptions,
  typeValue,
  onTypeChange,
  periodValue,
  onPeriodChange,
}: ActivityPageHeaderProps) {
  return (
    <>
      <PageHeader title={title} description={description} action={action} />

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
