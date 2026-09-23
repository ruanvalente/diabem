import type { LucideIcon } from "lucide-react";
import type { TimelineEventType } from "@/lib/health/types";
import type {
  ActivityChartData,
  DistributionData,
  GlucoseChartData,
  MealChartData,
} from "@/lib/analytics/types";

export type QuickAction = {
  icon: LucideIcon;
  label: string;
  href: string;
  color: string;
};

export type SummaryHref =
  | "/glucose"
  | "/meals"
  | "/activity"
  | "/notes"
  | "/medications";

export type SummaryCard = {
  href: SummaryHref;
  icon: LucideIcon;
  title: string;
  count: number;
  last: string;
  color: string;
  bg: string;
};

export type RecentRecord = {
  id: string;
  type: TimelineEventType;
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  at: string;
  time: string;
};

export type ChartCard =
  | {
      kind: "glucose";
      title: string;
      subtitle?: string;
      summary: string;
      isEmpty: boolean;
      data: GlucoseChartData;
    }
  | {
      kind: "activity";
      title: string;
      subtitle?: string;
      summary: string;
      isEmpty: boolean;
      data: ActivityChartData;
    }
  | {
      kind: "meals";
      title: string;
      subtitle?: string;
      summary: string;
      isEmpty: boolean;
      data: MealChartData;
    }
  | {
      kind: "distribution";
      title: string;
      subtitle?: string;
      summary: string;
      isEmpty: boolean;
      data: DistributionData;
    };
