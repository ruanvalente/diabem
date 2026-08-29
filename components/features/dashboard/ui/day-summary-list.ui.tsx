import type { SummaryCard } from "../types";
import { SummaryCardItem } from "./summary-card.ui";

type DaySummaryListProps = {
  cards: SummaryCard[];
};

export function DaySummaryList({ cards }: DaySummaryListProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Resumo do dia
      </h2>
      <div className="space-y-3">
        {cards.map((card) => (
          <SummaryCardItem key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}