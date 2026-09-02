import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ChevronRight } from "lucide-react";
import type { SummaryCard } from "../types";

type SummaryCardItemProps = {
  card: SummaryCard;
};

export function SummaryCardItem({ card }: SummaryCardItemProps) {
  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}
        >
          <card.icon className={`size-5 ${card.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {card.title}
            </h3>
            <span className="text-xs font-medium text-muted-foreground">
              {card.count} registro{card.count !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{card.last}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={card.href}
            aria-label={`Adicionar ${card.title}`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Plus className="size-3" aria-hidden="true" />
          </Link>
          <Link
            href={card.href}
            aria-label={`Ver histórico de ${card.title}`}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChevronRight className="size-3" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}