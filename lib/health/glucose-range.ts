export type GlucoseRange =
  | "low"
  | "in_range"
  | "high"
  | "very_high";

export type GlucoseRangeInfo = {
  range: GlucoseRange;
  label: string;
  badgeVariant: "default" | "secondary" | "destructive";
  badgeClassName?: string;
};

/**
 * Maps a glucose value to a status range for display. Deliberately descriptive,
 * never a medical recommendation.
 */
export function getGlucoseRange(value: number): GlucoseRange {
  if (value < 70) return "low";
  if (value <= 140) return "in_range";
  if (value <= 180) return "high";
  return "very_high";
}

export const GLUCOSE_RANGE_LABELS: Record<GlucoseRange, string> = {
  low: "Baixa",
  in_range: "No intervalo",
  high: "Alta",
  very_high: "Muito alta",
};

const INFO: Record<GlucoseRange, GlucoseRangeInfo> = {
  low: {
    range: "low",
    label: GLUCOSE_RANGE_LABELS.low,
    badgeVariant: "destructive",
  },
  in_range: {
    range: "in_range",
    label: GLUCOSE_RANGE_LABELS.in_range,
    badgeVariant: "default",
    badgeClassName: "border-success/30 bg-success/10 text-success",
  },
  high: {
    range: "high",
    label: GLUCOSE_RANGE_LABELS.high,
    badgeVariant: "secondary",
    badgeClassName: "border-warning/30 bg-warning/10 text-warning",
  },
  very_high: {
    range: "very_high",
    label: GLUCOSE_RANGE_LABELS.very_high,
    badgeVariant: "destructive",
  },
};

export function getGlucoseRangeInfo(value: number): GlucoseRangeInfo {
  return INFO[getGlucoseRange(value)];
}