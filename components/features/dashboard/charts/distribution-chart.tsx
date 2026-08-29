import type { DistributionItem } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

const SEGMENT_COLORS = ["bg-primary", "bg-success", "bg-warning"];

type DistributionChartProps = {
  items: DistributionItem[];
};

export function DistributionChart({ items }: DistributionChartProps) {
  const total = items.reduce((acc, item) => acc + item.count, 0);
  const maximum = Math.max(total, 1);

  const ariaSummary = items
    .map((item) => `${item.label}: ${item.count} registros`)
    .join(", ");

  return (
    <div>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        {items.map((item, index) =>
          item.count > 0 ? (
            <div
              key={item.period}
              className={SEGMENT_COLORS[index]}
              style={{ width: `${(item.count / maximum) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul
        className="mt-3 space-y-1.5"
        aria-label={`Distribuição por horário. ${ariaSummary}.`}
      >
        {items.map((item, index) => (
          <li
            key={item.period}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  SEGMENT_COLORS[index],
                )}
              />
              {item.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {item.count} {item.count === 1 ? "registro" : "registros"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
