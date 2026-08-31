import { Sparkles } from "lucide-react";
import type { Insight } from "@/lib/intelligence/types/insight.types";
import { InsightCard } from "./insights-card.ui";

type InsightsSectionProps = {
  insights: Insight[];
  renderCardAction?: (insight: Insight) => React.ReactNode;
  className?: string;
};

export function InsightsSection({
  insights,
  renderCardAction,
  className,
}: InsightsSectionProps) {
  if (insights.length === 0) return null;

  const visible = insights.slice(0, 3);

  return (
    <section className={className} aria-labelledby="insights-title">
      <h2
        id="insights-title"
        className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        Padrões observados
      </h2>

      <div className="space-y-3">
        {visible.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            action={renderCardAction?.(insight)}
          />
        ))}
      </div>

      {insights.length > 3 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Mostrando {visible.length} de {insights.length} observações.
        </p>
      )}
    </section>
  );
}
