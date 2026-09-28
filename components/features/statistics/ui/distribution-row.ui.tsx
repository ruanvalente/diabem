type DistributionRowProps = {
  label: string;
  count: number;
  total: number;
  valueLabel?: string;
  barClassName?: string;
};

/**
 * Single labelled bar of a distribution section, sized as `count / total`.
 *
 * The bar is exposed as a progressbar so the proportion is not conveyed by
 * color alone. `barClassName` recolors the bar.
 *
 * `count` is the bar numerator, which is not always a record count: sections
 * weighted by another measure pass that measure instead. When `valueLabel` is
 * given it replaces the default "{count} ({percentage}%)" text, and the
 * numerator is then used only to size the bar.
 */
export function DistributionRow({
  label,
  count,
  total,
  valueLabel,
  barClassName = "bg-primary",
}: DistributionRowProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  const displayValue = valueLabel ?? `${count} (${percentage}%)`;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{displayValue}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all ${barClassName}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
