import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple } from "lucide-react";
import type { MealStatistics } from "@/lib/analytics/statistics";
import { DistributionChart } from "@/components/features/dashboard/charts/distribution-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { DistributionRow } from "./distribution-row.ui";
import { StatCard } from "./stat-card.ui";

type MealsTabProps = {
  stats: MealStatistics;
};

export function MealsTab({ stats }: MealsTabProps) {
  if (!stats.hasEnoughData) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Apple}
          title="Nenhuma refeição registrada"
          description="Registre suas refeições para visualizar estatísticas de alimentação."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Refeições"
          value={String(stats.totalCount)}
          unit="no período"
        />
        {stats.byType.length > 0 && (
          <StatCard
            label="Tipos registrados"
            value={String(stats.byType.length)}
            unit={stats.byType.length === 1 ? "tipo" : "tipos"}
          />
        )}
      </div>

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
                  count={item.count}
                  total={stats.totalCount}
                  valueLabel={`${item.count} ${
                    item.count === 1 ? "refeição" : "refeições"
                  }`}
                  barClassName="bg-success"
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
