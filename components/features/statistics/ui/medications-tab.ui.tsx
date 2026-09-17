import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pill } from "lucide-react";
import type { MedicationStatistics } from "@/lib/analytics/statistics";
import { DistributionChart } from "@/components/features/dashboard/charts/distribution-chart";
import { DistributionRow } from "./distribution-row.ui";
import { EmptyState } from "@/components/shared/empty-state";

type MedicationsTabProps = {
  stats: MedicationStatistics;
  names: string[];
  filter: string;
  onFilterChange: (value: string) => void;
};

export function MedicationsTab({
  stats,
  names,
  filter,
  onFilterChange,
}: MedicationsTabProps) {
  if (!stats.hasEnoughData) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Pill}
          title="Nenhum medicamento registrado"
          description="Registre seus medicamentos para visualizar estatísticas de uso no período."
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
              Registros
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalCount}
            </p>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-(--shadow-card)]">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Medicamentos
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.distinctCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.distinctCount === 1 ? "distinto" : "distintos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {names.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">Filtrar por medicamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={filter}
              onValueChange={(value) => {
                if (value) onFilterChange(value);
              }}
            >
              <SelectTrigger
                aria-label="Filtrar por medicamento"
                className="h-12 w-full sm:w-64"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {names.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {stats.byRoute.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Distribuição por via de administração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byRoute.map((item) => (
                <DistributionRow
                  key={item.route}
                  label={item.label}
                  count={item.count}
                  total={stats.totalCount}
                  barClassName="bg-secondary"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.byName.length > 0 && (
        <Card className="border-border shadow-(--shadow-card)]">
          <CardHeader>
            <CardTitle className="text-base">
              Medicamentos registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byName.map((item) => (
                <DistributionRow
                  key={item.name}
                  label={item.name}
                  count={item.count}
                  total={stats.totalCount}
                  valueLabel={`${item.count} ${
                    item.count === 1 ? "registro" : "registros"
                  }`}
                  barClassName="bg-secondary"
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