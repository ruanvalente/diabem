import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from "lucide-react";
import type { GlucoseStatistics } from "@/lib/analytics/statistics";
import { GlucoseLineChart } from "@/components/features/dashboard/charts/glucose-line-chart";
import { DistributionChart } from "@/components/features/dashboard/charts/distribution-chart";
import { EmptyState } from "@/components/shared/empty-state";

type GlucoseTabProps = {
  stats: GlucoseStatistics;
};

function TrendIcon({ direction }: { direction: string }) {
  switch (direction) {
    case "increasing":
      return <TrendingUp className="mr-1 size-3" />;
    case "decreasing":
      return <TrendingDown className="mr-1 size-3" />;
    default:
      return <Minus className="mr-1 size-3" />;
  }
}

function TrendBadge({ direction, label }: { direction: string; label: string }) {
  const className =
    direction === "increasing"
      ? "border-warning/30 bg-warning/10 text-warning"
      : direction === "decreasing"
        ? "border-info/30 bg-info/10 text-info"
        : "border-success/30 bg-success/10 text-success";

  return (
    <Badge variant="outline" className={className}>
      <TrendIcon direction={direction} />
      {label}
    </Badge>
  );
}

function formatValue(value: number | null): string {
  return value !== null ? String(Math.round(value)) : "--";
}

export function GlucoseTab({ stats }: GlucoseTabProps) {
  if (stats.count === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={BarChart3}
          title="Sem medições neste período"
          description="Registre suas primeiras medições de glicemia para visualizar sua evolução."
        />
      </div>
    );
  }

  if (!stats.hasEnoughData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Registros"
            value={String(stats.count)}
            unit="no período"
          />
        </div>
        <EmptyState
          icon={BarChart3}
          title="Dados insuficientes"
          description="Registre pelo menos 2 medições de glicemia para visualizar os indicadores (média, tendência e tempo no intervalo)."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Média" value={formatValue(stats.average)} unit="mg/dL" />
        <StatCard label="Mínima" value={formatValue(stats.minimum)} unit="mg/dL" />
        <StatCard label="Máxima" value={formatValue(stats.maximum)} unit="mg/dL" />
        <StatCard label="Registros" value={String(stats.count)} unit="no período" />
      </div>

      {stats.chartData.points.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Glicemia ao longo do tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GlucoseLineChart
              points={stats.chartData.points}
              average={stats.chartData.average}
            />
          </CardContent>
        </Card>
      )}

      {stats.contextDistribution.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Distribuição por contexto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.contextDistribution.map((item) => (
                <DistributionRow
                  key={item.context}
                  label={item.label}
                  count={item.count}
                  total={stats.count}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.inRangePercentage !== null && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tempo no intervalo
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {stats.inRangePercentage}%
                </p>
              </div>
              <TrendBadge
                direction={stats.trendDirection}
                label={stats.trendLabel}
              />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${stats.inRangePercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {stats.rangeDistribution.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Faixas glicêmicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.rangeDistribution.map((item) => (
                <DistributionRow
                  key={item.range}
                  label={item.label}
                  count={item.count}
                  total={stats.count}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.distributionByTimeOfDay.total > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Distribuição por horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionChart items={stats.distributionByTimeOfDay.items} />
          </CardContent>
        </Card>
      )}
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
    <Card className="border-border shadow-(--shadow-card)]">
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
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
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
