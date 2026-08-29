import type { GlucoseReading } from "@/lib/db/types";

export type DashboardSummary = {
  period: {
    start?: string;
    end?: string;
  };
  glucose: {
    count: number;
    latest?: GlucoseReading;
  };
  meals: {
    count: number;
  };
  activities: {
    count: number;
    totalMinutes: number;
  };
  notes: {
    count: number;
  };
  totalRecords: number;
};

export type GlucoseChartPoint = {
  key: string;
  label: string;
  value: number;
};

export type GlucoseChartData = {
  points: GlucoseChartPoint[];
  count: number;
  average: number | null;
  minimum: number | null;
  maximum: number | null;
};

export type DayValue = {
  key: string;
  label: string;
  value: number;
};

export type ActivityChartData = {
  days: DayValue[];
  totalMinutes: number;
};

export type MealChartData = {
  days: DayValue[];
  totalCount: number;
};

export type RecordPeriod = "morning" | "afternoon" | "evening";

export type DistributionItem = {
  period: RecordPeriod;
  label: string;
  count: number;
};

export type DistributionData = {
  items: DistributionItem[];
  total: number;
};

export type ChartCardData<T> = {
  title: string;
  subtitle?: string;
  summary?: string;
  isEmpty: boolean;
  data: T;
};
