"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/use-auth";
import { useGlucose } from "@/lib/health/hooks/use-glucose";
import { useMeals } from "@/lib/health/hooks/use-meals";
import { useActivities } from "@/lib/health/hooks/use-activities";
import { useNotes } from "@/lib/health/hooks/use-notes";
import { getGlucoseRangeInfo } from "@/lib/health/glucose-range";
import {
  GLUCOSE_CONTEXT_LABELS,
  MEAL_TYPE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/health/constants";
import { formatTime, resolvePeriodRange } from "@/lib/date";
import { ErrorState } from "@/components/shared/error-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import {
  Droplets,
  Apple,
  Activity,
  NotebookPen,
  TrendingUp,
  Plus,
  ChevronRight,
} from "lucide-react";

const quickActions = [
  {
    icon: Droplets,
    label: "Glicemia",
    href: "/glucose",
    color: "bg-primary",
  },
  { icon: Apple, label: "Refeição", href: "/meals", color: "bg-success" },
  {
    icon: Activity,
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

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

type SummaryCard =
  | { href: "/glucose" }
  | { href: "/meals" }
  | { href: "/activity" }
  | { href: "/notes" };

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const glucose = useGlucose(userId);
  const meals = useMeals(userId);
  const activities = useActivities(userId);
  const notes = useNotes(userId);

  const glucoseFilters = glucose.applyFilters;
  const mealsFilters = meals.applyFilters;
  const activitiesFilters = activities.applyFilters;
  const notesFilters = notes.applyFilters;

  const [todayRange, setTodayRange] = useState(() => resolvePeriodRange("today"));

  useEffect(() => {
    const refreshToday = () => setTodayRange(resolvePeriodRange("today"));
    window.addEventListener("focus", refreshToday);
    return () => window.removeEventListener("focus", refreshToday);
  }, []);

  useEffect(() => {
    if (!userId) return;
    void glucoseFilters(todayRange);
    void mealsFilters(todayRange);
    void activitiesFilters(todayRange);
    void notesFilters(todayRange);
  }, [
    userId,
    todayRange,
    glucoseFilters,
    mealsFilters,
    activitiesFilters,
    notesFilters,
  ]);

  const isLoading =
    glucose.isLoading ||
    meals.isLoading ||
    activities.isLoading ||
    notes.isLoading;
  const error = glucose.error ?? meals.error ?? activities.error ?? notes.error;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
        <ErrorState
          message={error}
          onRetry={() => {
            void glucose.reload();
            void meals.reload();
            void activities.reload();
            void notes.reload();
          }}
        />
      </div>
    );
  }

  const lastGlucose = glucose.records[0];
  const lastGlucoseRange = lastGlucose
    ? getGlucoseRangeInfo(lastGlucose.value)
    : null;

  const summaryCards: {
    card: SummaryCard;
    icon: typeof Droplets;
    title: string;
    count: number;
    last: string;
    color: string;
    bg: string;
  }[] = [
    {
      card: { href: "/glucose" },
      icon: Droplets,
      title: "Glicemias",
      count: glucose.records.length,
      last: lastGlucose
        ? `${lastGlucose.value} mg/dL às ${formatTime(lastGlucose.measuredAt)}`
        : "Nenhuma medição hoje",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      card: { href: "/meals" },
      icon: Apple,
      title: "Refeições",
      count: meals.records.length,
      last: meals.records[0]
        ? `${MEAL_TYPE_LABELS[meals.records[0].type]} às ${formatTime(meals.records[0].consumedAt)}`
        : "Nenhuma refeição hoje",
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      card: { href: "/activity" },
      icon: Activity,
      title: "Atividade",
      count: activities.records.length,
      last: activities.records[0]
        ? `${ACTIVITY_TYPE_LABELS[activities.records[0].type]} · ${activities.records[0].durationMinutes} min`
        : "Nenhuma atividade hoje",
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      card: { href: "/notes" },
      icon: NotebookPen,
      title: "Observações",
      count: notes.records.length,
      last: notes.records[0]?.content ?? "Nenhuma observação hoje",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting(new Date())}, {user?.name ?? "usuário"} !
        </h1>
        <p className="text-muted-foreground">
          Veja como foi seu acompanhamento hoje.
        </p>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <Card className="mb-6 border-border">
            <CardContent className="p-5">
              {lastGlucose ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-1 text-sm font-medium text-muted-foreground">
                        Última medição
                      </p>
                      <p className="text-3xl font-bold tracking-tight text-foreground">
                        {lastGlucose.value}{" "}
                        <span className="text-base font-normal text-muted-foreground">
                          mg/dL
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatTime(lastGlucose.measuredAt)} ·{" "}
                        {GLUCOSE_CONTEXT_LABELS[lastGlucose.context]}
                      </p>
                    </div>
                    <Badge
                      variant={lastGlucoseRange?.badgeVariant}
                      className={lastGlucoseRange?.badgeClassName}
                    >
                      {lastGlucoseRange?.label}
                    </Badge>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">
                      Última medição
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      Sem medições hoje
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Registre sua glicemia para começar.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="gap-1 text-muted-foreground"
                  >
                    <TrendingUp className="size-3" />—
                  </Badge>
                </div>
              )}
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {glucose.records.length} registro
                  {glucose.records.length !== 1 ? "s" : ""} hoje
                </span>
                <Link
                  href="/glucose"
                  className="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Ver histórico
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Ações rápidas
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-(--shadow-elevated) active:scale-[0.98]">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${action.color} text-white`}
                    >
                      <action.icon className="size-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                      {action.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Resumo do dia
            </h2>
            <div className="space-y-3">
              {summaryCards.map((card) => (
                <Card key={card.title} className="border-border">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
                    >
                      <card.icon className={`size-5 ${card.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">
                          {card.title}
                        </h3>
                        <span className="text-xs font-medium text-muted-foreground">
                          {card.count} registro{card.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {card.last}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={card.card.href}>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Adicionar"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </Link>
                      <Link href={card.card.href}>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Ver histórico"
                        >
                          <ChevronRight className="size-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
