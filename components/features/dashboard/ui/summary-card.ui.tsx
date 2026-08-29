import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <Link href={card.href}>
            <Button variant="ghost" size="icon-xs" aria-label="Adicionar">
              <Plus className="size-3" />
            </Button>
          </Link>
          <Link href={card.href}>
            <Button variant="ghost" size="icon-xs" aria-label="Ver histórico">
              <ChevronRight className="size-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}