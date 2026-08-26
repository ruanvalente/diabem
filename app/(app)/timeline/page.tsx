"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Droplets,
  Apple,
  Activity,
  Heart,
} from "lucide-react";

const timelineItems = [
  {
    time: "18:42",
    type: "glucose",
    icon: Droplets,
    title: "Glicemia",
    detail: "112 mg/dL",
    context: "Após a refeição",
    color: "text-primary",
    bg: "bg-primary/10",
    status: "success" as const,
  },
  {
    time: "18:10",
    type: "activity",
    icon: Activity,
    title: "Atividade",
    detail: "Caminhada — 30 min",
    context: "Moderada",
    color: "text-warning",
    bg: "bg-warning/10",
    status: "default" as const,
  },
  {
    time: "13:05",
    type: "meal",
    icon: Apple,
    title: "Refeição",
    detail: "Almoço",
    context: "Arroz, feijão, frango e salada",
    color: "text-success",
    bg: "bg-success/10",
    status: "default" as const,
  },
  {
    time: "12:45",
    type: "medication",
    icon: Heart,
    title: "Medicamento",
    detail: "Metformina 850mg",
    context: "Após o almoço",
    color: "text-destructive",
    bg: "bg-destructive/10",
    status: "default" as const,
  },
  {
    time: "08:30",
    type: "glucose",
    icon: Droplets,
    title: "Glicemia",
    detail: "95 mg/dL",
    context: "Jejum",
    color: "text-primary",
    bg: "bg-primary/10",
    status: "success" as const,
  },
  {
    time: "07:45",
    type: "meal",
    icon: Apple,
    title: "Refeição",
    detail: "Café da manhã",
    context: "Pão, ovo e café",
    color: "text-success",
    bg: "bg-success/10",
    status: "default" as const,
  },
];

const typeFilters = [
  { value: "all", label: "Todos" },
  { value: "glucose", label: "Glicemia" },
  { value: "meal", label: "Refeições" },
  { value: "activity", label: "Atividade" },
  { value: "medication", label: "Medicamentos" },
];

export default function TimelinePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Timeline
        </h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe seus registros do dia em ordem cronológica
        </p>
      </div>

      <Tabs defaultValue="all" className="mb-6">
        <TabsList className="w-full justify-start">
          {typeFilters.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {timelineItems.map((item, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-card">
                <item.icon className={`size-4 ${item.color}`} />
              </div>

              {/* Content */}
              <Card className="flex-1 border-border shadow-[var(--shadow-card)]">
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.time}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        item.status === "success"
                          ? "border-success/30 bg-success/10 text-success"
                          : ""
                      }`}
                    >
                      {item.title}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.detail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.context}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
