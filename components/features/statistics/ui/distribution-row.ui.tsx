type DistributionRowProps = {
  label: string;
  count: number;
  total: number;
  valueLabel?: string;
  barClassName?: string;
};

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
