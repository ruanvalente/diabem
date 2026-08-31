import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { Insight } from "@/lib/intelligence/types/insight.types";

type InsightCardProps = {
  insight: Insight;
  action?: React.ReactNode;
  className?: string;
};

export function InsightCard({ insight, action, className }: InsightCardProps) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-semibold text-foreground">{insight.title}</p>
        <p className="text-sm text-muted-foreground">{insight.description}</p>
        {insight.evidence.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {insight.evidence.length} dado
            {insight.evidence.length !== 1 ? "s" : ""} analisado
            {insight.evidence.length !== 1 ? "s" : ""}
          </p>
        )}
        {action}
      </CardContent>
    </Card>
  );
}
