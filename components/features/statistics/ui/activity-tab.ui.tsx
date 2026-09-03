import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityStatistics } from "@/lib/analytics/statistics";
import { VerticalBarChart } from "@/components/features/dashboard/charts/vertical-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";

type ActivityTabProps = {
  stats: ActivityStatistics;
};

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
}

export function ActivityTab({ stats }: ActivityTabProps) {
  if (!stats.hasEnoughData) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={ActivityIcon}
          title="Nenhuma atividade registrada"
          description="Registre suas atividades físicas para visualizar estatísticas de exercício."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Minutos totais
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalMinutes}
            </p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Atividades
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalCount}
            </p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      {stats.averageMinutesPerDay !== null && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Média diária
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatMinutes(stats.averageMinutesPerDay)}
            </p>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>
      )}

      {stats.chartData.days.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Atividade ao longo do tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VerticalBarChart
              items={stats.chartData.days}
              valueLabel={(v) => `${v} min`}
              barClassName="bg-warning"
            />
          </CardContent>
        </Card>
      )}

      {stats.byType.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Distribuição por tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byType.map((item) => (
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">
                      {item.count} {item.count === 1 ? "registro" : "registros"} · {formatMinutes(item.totalMinutes)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-warning transition-all"
                      style={{
                        width: `${Math.round((item.totalMinutes / stats.totalMinutes) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
