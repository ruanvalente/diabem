import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { GlucoseLineChart } from "../charts/glucose-line-chart";
import { VerticalBarChart } from "../charts/vertical-bar-chart";
import { DistributionChart } from "../charts/distribution-chart";
import { cn } from "@/lib/utils";
import { BarChart3, Droplets } from "lucide-react";
import type { ChartCard } from "../widget/dashboard.data";

function renderChart(card: ChartCard): ReactNode {
  switch (card.kind) {
    case "glucose":
      return (
        <GlucoseLineChart
          points={card.data.points}
          average={card.data.average}
        />
      );
    case "activity":
      return (
        <VerticalBarChart
          items={card.data.days}
          valueLabel={(value) => `${value} min`}
          barClassName="bg-warning"
        />
      );
    case "meals":
      return (
        <VerticalBarChart
          items={card.data.days}
          valueLabel={(value) =>
            `${value} ${value === 1 ? "refeição" : "refeições"}`
          }
          barClassName="bg-success"
        />
      );
    case "distribution":
      return <DistributionChart items={card.data.items} />;
  }
}

type ChartCardViewProps = {
  card: ChartCard;
  className?: string;
};

function ChartCardView({ card, className }: ChartCardViewProps) {
  return (
    <Card className={cn("border-border", className)} size="sm">
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
        {card.subtitle && <CardDescription>{card.subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {card.isEmpty ? (
          <p className="text-sm text-muted-foreground">{card.summary}</p>
        ) : (
          <>
            {renderChart(card)}
            <p className="text-xs text-muted-foreground">{card.summary}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type DashboardChartsSectionProps = {
  cards: ChartCard[];
  hasData: boolean;
  className?: string;
};

export function DashboardChartsSection({
  cards,
  hasData,
  className,
}: DashboardChartsSectionProps) {
  return (
    <section className={className} aria-labelledby="dashboard-charts-title">
      <h2
        id="dashboard-charts-title"
        className="mb-3 text-sm font-semibold text-foreground"
      >
        Como está seu acompanhamento
      </h2>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Gráficos aparecem com seus registros"
          description="Ao registrar glicemia, refeições e atividades, você vê tendências e a distribuição dos seus registros."
          action={
            <Link href="/glucose">
              <Button size="sm">
                <Droplets className="size-4" aria-hidden="true" />
                Registrar primeira glicemia
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCardView
            card={cards.find((card) => card.kind === "glucose")!}
            className="md:col-span-2"
          />
          <ChartCardView
            card={cards.find((card) => card.kind === "distribution")!}
          />
          <ChartCardView
            card={cards.find((card) => card.kind === "activity")!}
          />
          <ChartCardView
            card={cards.find((card) => card.kind === "meals")!}
            className="md:col-span-2"
          />
        </div>
      )}
    </section>
  );
}
