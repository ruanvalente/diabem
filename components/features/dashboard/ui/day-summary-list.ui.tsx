import type { SummaryCard } from "../types";
import { SummaryCardItem } from "./summary-card.ui";

type DaySummaryListProps = {
  cards: SummaryCard[];
  title?: string;
};

export function DaySummaryList({
  cards,
  title = "Resumo do dia",
}: DaySummaryListProps) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">
        {cards.map((card) => (
          <SummaryCardItem key={card.title} card={card} />
        ))}
      </div>
    </div>
  );
}
