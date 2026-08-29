import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import { getGlucoseRangeInfo } from "@/lib/health/glucose-range";
import {
  ACTIVITY_TYPE_LABELS,
  MEAL_TYPE_LABELS,
} from "@/lib/health/constants";
import { formatTime } from "@/lib/date";
import {
  Activity as ActivityIcon,
  Apple,
  Droplets,
  NotebookPen,
} from "lucide-react";
import type { QuickAction, SummaryCard } from "../types";

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

export function buildSummaryCards(data: DashboardData): SummaryCard[] {
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
        : "Nenhuma medição hoje",
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
        : "Nenhuma refeição hoje",
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
        : "Nenhuma atividade hoje",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      href: "/notes",
      icon: NotebookPen,
      title: "Observações",
      count: notes.length,
      last: lastNote?.content ?? "Nenhuma observação hoje",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];
}

export function getLastReadingInfo(reading?: GlucoseReading) {
  if (!reading) return null;
  return getGlucoseRangeInfo(reading.value);
}