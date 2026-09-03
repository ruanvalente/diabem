import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple } from "lucide-react";
import type { MealStatistics } from "@/lib/analytics/statistics";
import { DistributionChart } from "@/components/features/dashboard/charts/distribution-chart";
import { EmptyState } from "@/components/shared/empty-state";

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
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Refeições
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalCount}
            </p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        {stats.byType.length > 0 && (
          <Card className="border-border shadow-(--shadow-card)]">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Tipos registrados
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stats.byType.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.byType.length === 1 ? "tipo" : "tipos"}
              </p>
            </CardContent>
          </Card>
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
                <div key={item.type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">
                      {item.count} {item.count === 1 ? "refeição" : "refeições"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{
                        width: `${Math.round((item.count / stats.totalCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
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
