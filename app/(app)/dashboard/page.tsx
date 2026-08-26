"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Droplets,
  Apple,
  Activity,
  Heart,
  Plus,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const summaryCards = [
  {
    icon: Droplets,
    label: "Glicemias",
    count: 4,
    last: "112 mg/dL às 18:42",
    color: "text-primary",
    bg: "bg-primary/10",
    href: "/glucose",
  },
  {
    icon: Apple,
    label: "Refeições",
    count: 3,
    last: "Jantar às 19:15",
    color: "text-success",
    bg: "bg-success/10",
    href: "/meals",
  },
  {
    icon: Activity,
    label: "Atividade",
    count: 1,
    last: "Caminhada — 30 min",
    color: "text-warning",
    bg: "bg-warning/10",
    href: "/activity",
  },
  {
    icon: Heart,
    label: "Medicamentos",
    count: 2,
    last: "Metformina 850mg",
    color: "text-destructive",
    bg: "bg-destructive/10",
    href: "/medications",
  },
];

const quickActions = [
  { icon: Droplets, label: "Glicemia", href: "/glucose", color: "bg-primary" },
  { icon: Apple, label: "Refeição", href: "/meals", color: "bg-success" },
  {
    icon: Activity,
    label: "Atividade",
    href: "/activity",
    color: "bg-warning",
  },
  {
    icon: Heart,
    label: "Medicamento",
    href: "/medications",
    color: "bg-destructive",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Boa noite, Ruan
        </h1>
        <p className="text-muted-foreground">
          Veja como foi seu acompanhamento hoje.
        </p>
      </div>

      {/* Status Card */}
      <Card className="mb-6 border-border shadow-(--shadow-card)]">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Última medição
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                112{" "}
                <span className="text-base font-normal text-muted-foreground">
                  mg/dL
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hoje às 18:42
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1 border-success/30 bg-success/10 text-success"
            >
              <TrendingUp className="size-3" />
              Estável
            </Badge>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">4 registros hoje</span>
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

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-(--shadow-card)] transition-all hover:shadow-(--shadow-elevated)] active:scale-[0.98]">
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

      {/* Daily Summary */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Resumo do dia
        </h2>
        <div className="space-y-3">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="border-border shadow-(--shadow-card)]"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
                >
                  <card.icon className={`size-5 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      {card.label}
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
                  <Link href={card.href}>
                    <Button variant="ghost" size="icon-xs">
                      <Plus className="size-3" />
                    </Button>
                  </Link>
                  <Link href={card.href}>
                    <Button variant="ghost" size="icon-xs">
                      <ChevronRight className="size-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
