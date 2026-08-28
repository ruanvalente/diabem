"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PeriodFilter as PeriodFilterValue } from "@/lib/date";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS: { value: PeriodFilterValue; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "7 dias" },
  { value: "month", label: "Este mês" },
  { value: "all", label: "Todo o período" },
];

type PeriodFilterProps = {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  className?: string;
};

export function PeriodFilter({
  value,
  onChange,
  className,
}: PeriodFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as PeriodFilterValue);
      }}
    >
      <SelectTrigger size="default" className={cn("h-9 min-w-32", className)}>
        <CalendarDays className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}