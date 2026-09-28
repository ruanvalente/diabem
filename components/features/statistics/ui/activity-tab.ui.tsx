import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityStatistics } from "@/lib/analytics/statistics";
import { VerticalBarChart } from "@/components/features/dashboard/charts/vertical-bar-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatActivityDuration } from "@/lib/health/activity-display";
import { DistributionRow } from "./distribution-row.ui";
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
                <DistributionRow
                  key={item.type}
                  label={item.label}
                  count={item.totalMinutes}
                  total={stats.totalMinutes}
                  valueLabel={`${item.count} ${
                    item.count === 1 ? "registro" : "registros"
                  } · ${formatActivityDuration(item.totalMinutes)}`}
                  barClassName="bg-warning"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
