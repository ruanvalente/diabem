"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Activity,
  Apple,
  BarChart3,
} from "lucide-react";

export default function StatisticsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Estatísticas
        </h1>
        <p className="text-sm text-muted-foreground">
          Visualize gráficos e indicadores da sua saúde
        </p>
      </div>

      <Tabs defaultValue="glucose" className="mb-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="glucose">Glicemia</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="meals">Alimentação</TabsTrigger>
        </TabsList>

        <TabsContent value="glucose" className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Média" value="118" unit="mg/dL" />
            <StatCard label="Mínima" value="82" unit="mg/dL" />
            <StatCard label="Máxima" value="165" unit="mg/dL" />
            <StatCard label="Registros" value="28" unit="este mês" />
          </div>

          {/* Chart Placeholder */}
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">
                Glicemia ao longo do tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-xl bg-muted/50">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Gráfico será exibido aqui
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Registre dados para visualizar tendências
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">
                Distribuição por contexto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <DistributionRow label="Jejum" count={8} total={28} />
                <DistributionRow label="Antes da refeição" count={6} total={28} />
                <DistributionRow label="Após a refeição" count={10} total={28} />
                <DistributionRow label="Antes de dormir" count={4} total={28} />
              </div>
            </CardContent>
          </Card>

          {/* In Range Percentage */}
          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tempo no intervalo
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    72%
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-success/30 bg-success/10 text-success"
                >
                  <TrendingUp className="mr-1 size-3" />
                  Estável
                </Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: "72%" }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Minutos esta semana" value="120" unit="min" />
            <StatCard label="Atividades" value="4" unit="esta semana" />
          </div>

          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex h-48 items-center justify-center rounded-xl bg-muted/50">
                <div className="text-center">
                  <Activity className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Gráfico de atividades
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Refeições" value="21" unit="este mês" />
            <StatCard label="Carboidratos" value="180g" unit="média/dia" />
          </div>

          <Card className="border-border shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex h-48 items-center justify-center rounded-xl bg-muted/50">
                <div className="text-center">
                  <Apple className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Gráfico de alimentação
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <Card className="border-border shadow-[var(--shadow-card)]">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </CardContent>
    </Card>
  );
}

function DistributionRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const percentage = Math.round((count / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
