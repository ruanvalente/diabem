"use client";

import { PageHeader } from "@/components/shared/page-header";
import { PeriodFilter } from "@/components/shared/period-filter";
import { OptionPills } from "@/components/shared/option-pills";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import type { GlucoseReading } from "@/lib/db/types";
import type { ReactNode } from "react";

type GlucosePageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  contextOptions: { value: GlucoseReading["context"]; label: string }[];
  contextValue: GlucoseReading["context"] | null;
  onContextChange: (value: GlucoseReading["context"] | undefined) => void;
  periodValue: PeriodFilterValue;
  onPeriodChange: (value: PeriodFilterValue) => void;
};

export function GlucosePageHeader({
  title,
  description,
  action,
  contextOptions,
  contextValue,
  onContextChange,
  periodValue,
  onPeriodChange,
}: GlucosePageHeaderProps) {
  return (
    <>
      <PageHeader title={title} description={description} action={action} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <OptionPills
          options={contextOptions}
          value={contextValue}
          onChange={onContextChange}
        />
        <PeriodFilter value={periodValue} onChange={onPeriodChange} />
      </div>
    </>
  );
}
