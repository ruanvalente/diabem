import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DataQuality } from "@/lib/intelligence/types/analytics.types";

const LEVEL_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
  unknown: "Desconhecida",
};

type QualityIndicatorProps = {
  quality: DataQuality;
  className?: string;
};

/**
 * Presents the technical data-quality level of the analyzed period.
 *
 * The level is always communicated as text (never color alone) so screen
 * readers and low-vision users get the same information. Color only
 * reinforces the text label.
 */
export function QualityIndicator({ quality, className }: QualityIndicatorProps) {
  const level = LEVEL_LABELS[quality.level] ?? quality.level;
  const score = Math.round(quality.score * 100);
  const issueCount = quality.issues.length;

  return (
    <Card className={className}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Qualidade dos dados
          </span>
          <Badge className={cn(getBadgeClass(quality.level))}>
            {level}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Índice de qualidade: {score}%
        </p>
        {issueCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {issueCount} inconsistência{issueCount !== 1 ? "s" : ""} técnica
            {issueCount !== 1 ? "s" : ""} detectada
            {issueCount !== 1 ? "s" : ""}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function getBadgeClass(level: DataQuality["level"]): string {
  switch (level) {
    case "high":
      return "bg-emerald-100 text-emerald-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}