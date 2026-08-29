import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, TrendingUp } from "lucide-react";
import type { GlucoseReading } from "@/lib/db/types";
import type { GlucoseRangeInfo } from "@/lib/health/glucose-range";
import { GLUCOSE_CONTEXT_LABELS } from "@/lib/health/constants";
import { formatTime } from "@/lib/date";

type LastReadingCardProps = {
  reading?: GlucoseReading;
  rangeInfo: GlucoseRangeInfo | null;
  count: number;
};

export function LastReadingCard({
  reading,
  rangeInfo,
  count,
}: LastReadingCardProps) {
  const countLabel = `${count} registro${count !== 1 ? "s" : ""}`;

  return (
    <Card className="mb-6 border-border">
      <CardContent className="p-5">
        {reading ? (
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Última medição
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {reading.value}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  mg/dL
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatTime(reading.measuredAt)} ·{" "}
                {GLUCOSE_CONTEXT_LABELS[reading.context]}
              </p>
            </div>
            {rangeInfo && (
              <Badge
                variant={rangeInfo.badgeVariant}
                className={rangeInfo.badgeClassName}
              >
                {rangeInfo.label}
              </Badge>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                Última medição
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                Sem medições hoje
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registre sua glicemia para começar.
              </p>
            </div>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <TrendingUp className="size-3" />—
            </Badge>
          </div>
        )}
        <Separator className="my-4" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{countLabel} hoje</span>
          <Link
            href="/glucose"
            className="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver histórico
            <ChevronRight className="size-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}