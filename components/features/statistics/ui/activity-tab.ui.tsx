import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityStatistics } from "@/lib/analytics/statistics";
import { VerticalBarChart } from "@/components/features/dashboard/charts/vertical-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatActivityDuration } from "@/lib/health/activity-display";
import { StatCard } from "./stat-card.ui";

type ActivityTabProps = {
  stats: ActivityStatistics;
};

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
        <StatCard
          label="Minutos totais"
          value={String(stats.totalMinutes)}
          unit="no período"
        />
        <StatCard
          label="Atividades"
          value={String(stats.totalCount)}
          unit="no período"
        />
      </div>

      {stats.averageMinutesPerDay !== null && (
        <StatCard
          label="Média diária"
          value={formatActivityDuration(stats.averageMinutesPerDay)}
          unit="por dia"
        />
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
                      {item.count} {item.count === 1 ? "registro" : "registros"} · {formatActivityDuration(item.totalMinutes)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-warning transition-all"
                      style={{
                        width: `${stats.totalMinutes > 0 ? Math.round((item.totalMinutes / stats.totalMinutes) * 100) : 0}%`,
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
