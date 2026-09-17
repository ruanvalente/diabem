import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Insight } from "@/lib/intelligence/types/insight.types";
import {
  formatMetricLabel,
  formatMetricValue,
} from "@/lib/intelligence/insights/format";

type InsightDetailsProps = {
  insight: Insight;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function InsightDetails({ insight }: InsightDetailsProps) {
  const period =
    insight.evidence[0]?.period ?? insight.evidence[1]?.period;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="hover:bg-transparent">
            Por que estou vendo isso?
            <span className="sr-only"> sobre {insight.title}</span>
          </Button>
        }
      />
      <DialogContent showCloseButton className="max-w-md">
        <DialogHeader>
          <DialogTitle>{insight.title}</DialogTitle>
          <DialogDescription>{insight.description}</DialogDescription>
        </DialogHeader>

        {insight.explanation && (
          <p className="text-sm text-muted-foreground">
            {insight.explanation}
          </p>
        )}

        {insight.evidence.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Base dos dados</p>
            <dl className="space-y-1.5">
              {insight.evidence.map((evidence, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <dt className="text-muted-foreground">
                    {formatMetricLabel(evidence.metric)}
                  </dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {formatMetricValue(evidence.metric, evidence.value)}
                    {evidence.comparison !== undefined &&
                      ` (anterior: ${formatMetricValue(
                        evidence.metric,
                        evidence.comparison
                      )})`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">
            Como este insight foi gerado
          </p>
          <dl className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center justify-between gap-3">
              <dt>Regra aplicada</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {insight.ruleId} v{insight.ruleVersion}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Registros considerados</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {insight.sourceIds.length}
              </dd>
            </div>
            {period && (
              <div className="flex items-center justify-between gap-3">
                <dt>Período analisado</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatDate(period.start)} a {formatDate(period.end)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <dt>Gerado em</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {formatDate(insight.generatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-xs text-muted-foreground">
          Este padrão foi identificado a partir dos seus registros e não
          representa um diagnóstico médico.
        </p>

        <DialogFooter>
          <Link
            href="/timeline"
            aria-label="Ver registros relacionados ao padrão observado"
            className="flex w-full items-center justify-center rounded-lg text-sm font-medium text-secondary-foreground shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          >
            Ver registros relacionados
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}