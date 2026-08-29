import type { DayValue } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

type VerticalBarChartProps = {
  items: DayValue[];
  valueLabel: (value: number) => string;
  barClassName?: string;
};

export function VerticalBarChart({
  items,
  valueLabel,
  barClassName,
}: VerticalBarChartProps) {
  if (items.length === 0) return null;

  const maximum = Math.max(...items.map((item) => item.value), 1);
  const showValueLabels = items.length <= 14;
  const labelEvery = items.length <= 14 ? 1 : Math.ceil(items.length / 3);

  const ariaSummary = items
    .map((item) => `${item.label}: ${valueLabel(item.value)}`)
    .join(", ");

  return (
    <div aria-label={`Gráfico de barras. ${ariaSummary}.`} role="img">
      <div className="flex h-24 gap-1.5">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex min-w-0 flex-1 flex-col justify-end"
            title={`${item.label}: ${valueLabel(item.value)}`}
          >
            {showValueLabels && (
              <span className="mb-0.5 text-center text-[10px] leading-none font-medium tabular-nums text-muted-foreground">
                {item.value}
              </span>
            )}
            <div className="flex h-full w-full items-end">
              <div
                className={cn("w-full rounded-t-md", barClassName)}
                style={{
                  height: `${(Math.max(item.value, 0) / maximum) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {items.map((item, index) => (
          <span
            key={item.key}
            className="min-w-0 flex-1 text-center text-[10px] leading-none text-muted-foreground"
          >
            {index % labelEvery === 0 || index === items.length - 1
              ? item.label
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
