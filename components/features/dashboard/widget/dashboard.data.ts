import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import { getGlucoseRangeInfo } from "@/lib/health/glucose-range";
import {
  ACTIVITY_TYPE_LABELS,
  GLUCOSE_CONTEXT_LABELS,
  MEAL_TYPE_LABELS,
} from "@/lib/health/constants";
import {
  getActivityChartData,
  getGlucoseChartData,
  getMealChartData,
  getRecordDistributionData,
} from "@/lib/analytics/charts";
import { getRecentRecords } from "@/lib/analytics/dashboard";
import type {
  ActivityChartData,
  DistributionData,
  GlucoseChartData,
  MealChartData,
} from "@/lib/analytics/types";
import { formatTime } from "@/lib/date";
import {
  Activity as ActivityIcon,
  Apple,
  Droplets,
  NotebookPen,
} from "lucide-react";
import type { QuickAction, RecentRecord, SummaryCard } from "../types";

export const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Droplets,
    label: "Glicemia",
    href: "/glucose",
    color: "bg-primary",
  },
  { icon: Apple, label: "Refeição", href: "/meals", color: "bg-success" },
  {
    icon: ActivityIcon,
    label: "Atividade",
    href: "/activity",
    color: "bg-warning",
  },
  {
    icon: NotebookPen,
    label: "Observação",
    href: "/notes",
    color: "bg-destructive",
  },
];

type DashboardData = {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  notes: Note[];
};

/** Builds the "Resumo do período" cards from period-scoped records. */
export function buildSummaryCards(
  data: DashboardData,
  adverbial: string,
): SummaryCard[] {
  const { glucose, meals, activities, notes } = data;

  const lastGlucose = glucose[0];
  const lastMeal = meals[0];
  const lastActivity = activities[0];
  const lastNote = notes[0];

  return [
    {
      href: "/glucose",
      icon: Droplets,
      title: "Glicemias",
      count: glucose.length,
      last: lastGlucose
        ? `${lastGlucose.value} mg/dL às ${formatTime(lastGlucose.measuredAt)}`
        : `Nenhuma medição ${adverbial}`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      href: "/meals",
      icon: Apple,
      title: "Refeições",
      count: meals.length,
      last: lastMeal
        ? `${MEAL_TYPE_LABELS[lastMeal.type]} às ${formatTime(lastMeal.consumedAt)}`
        : `Nenhuma refeição ${adverbial}`,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      href: "/activity",
      icon: ActivityIcon,
      title: "Atividade",
      count: activities.length,
      last: lastActivity
        ? `${ACTIVITY_TYPE_LABELS[lastActivity.type]} · ${lastActivity.durationMinutes} min`
        : `Nenhuma atividade ${adverbial}`,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      href: "/notes",
      icon: NotebookPen,
      title: "Observações",
      count: notes.length,
      last: lastNote?.content ?? `Nenhuma observação ${adverbial}`,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];
}

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

export function buildDashboardCharts(
  data: DashboardData,
  range: { from?: string; to?: string },
): { cards: ChartCard[]; hasData: boolean } {
  const glucose = getGlucoseChartData(data.glucose);
  const activity = getActivityChartData(data.activities, range);
  const meals = getMealChartData(data.meals, range);
  const distribution = getRecordDistributionData([
    ...data.glucose.map((record) => record.measuredAt),
    ...data.meals.map((record) => record.consumedAt),
    ...data.activities.map((record) => record.startedAt),
    ...data.notes.map((record) => record.createdAt),
  ]);

  const glucoseSummary =
    glucose.count === 0
      ? "Sem medições no período."
      : `${glucose.count} ${glucose.count === 1 ? "medição" : "medições"} · média ${glucose.average} mg/dL · mín ${glucose.minimum} · máx ${glucose.maximum}`;

  const activitySummary =
    activity.totalMinutes === 0
      ? "Nenhuma atividade no período."
      : `${activity.totalMinutes} min de atividade no período.`;

  const mealsSummary =
    meals.totalCount === 0
      ? "Nenhuma refeição no período."
      : `${meals.totalCount} ${meals.totalCount === 1 ? "refeição" : "refeições"} no período.`;

  const distributionSummary =
    distribution.total === 0
      ? "Nenhum registro no período."
      : `${distribution.total} registros no período.`;

  const cards: ChartCard[] = [
    {
      kind: "glucose",
      title: "Tendência da glicemia",
      subtitle:
        glucose.count > 0 ? `Média ${glucose.average} mg/dL` : undefined,
      summary: glucoseSummary,
      isEmpty: glucose.count === 0,
      data: glucose,
    },
    {
      kind: "distribution",
      title: "Distribuição por horário",
      summary: distributionSummary,
      isEmpty: distribution.total === 0,
      data: distribution,
    },
    {
      kind: "activity",
      title: "Atividade",
      subtitle: activity.totalMinutes > 0 ? "Minutos por dia" : undefined,
      summary: activitySummary,
      isEmpty: activity.totalMinutes === 0,
      data: activity,
    },
    {
      kind: "meals",
      title: "Refeições",
      subtitle: meals.totalCount > 0 ? "Refeições por dia" : undefined,
      summary: mealsSummary,
      isEmpty: meals.totalCount === 0,
      data: meals,
    },
  ];

  const hasData = cards.some((card) => !card.isEmpty);
  return { cards, hasData };
}

export function buildRecentRecords(data: DashboardData): RecentRecord[] {
  const recent = getRecentRecords(data, 5);
  const items: RecentRecord[] = [
    ...recent.glucose.map<RecentRecord>((record) => ({
      id: record.id,
      type: "glucose",
      href: "/glucose",
      icon: Droplets,
      title: "Glicemia",
      detail: `${record.value} mg/dL · ${GLUCOSE_CONTEXT_LABELS[record.context]}`,
      at: record.measuredAt,
      time: formatTime(record.measuredAt),
    })),
    ...recent.meals.map<RecentRecord>((record) => ({
      id: record.id,
      type: "meal",
      href: "/meals",
      icon: Apple,
      title: MEAL_TYPE_LABELS[record.type],
      detail: record.description,
      at: record.consumedAt,
      time: formatTime(record.consumedAt),
    })),
    ...recent.activities.map<RecentRecord>((record) => ({
      id: record.id,
      type: "activity",
      href: "/activity",
      icon: ActivityIcon,
      title: ACTIVITY_TYPE_LABELS[record.type],
      detail: `${record.durationMinutes} min`,
      at: record.startedAt,
      time: formatTime(record.startedAt),
    })),
    ...recent.notes.map<RecentRecord>((record) => ({
      id: record.id,
      type: "note",
      href: "/notes",
      icon: NotebookPen,
      title: "Observação",
      detail: record.content,
      at: record.createdAt,
      time: formatTime(record.createdAt),
    })),
  ];

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
}

export function getLastReadingInfo(reading?: GlucoseReading) {
  if (!reading) return null;
  return getGlucoseRangeInfo(reading.value);
}
