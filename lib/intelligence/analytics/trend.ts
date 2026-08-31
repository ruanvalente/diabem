import type { Trend, TrendDirection } from "../types/analytics.types";

const MIN_DATA_POINTS = 5;

export function calculateTrend(values: number[]): Trend {
  if (values.length < MIN_DATA_POINTS) {
    return { direction: "insufficient_data" };
  }

  const n = values.length;
  const indices = values.map((_, i) => i);
  const avgIndex = indices.reduce((a, b) => a + b, 0) / n;
  const avgValue = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (indices[i] - avgIndex) * (values[i] - avgValue);
    denominator += (indices[i] - avgIndex) ** 2;
  }

  if (denominator === 0) return { direction: "stable", confidence: 1 };

  const slope = numerator / denominator;

  const range = Math.max(...values) - Math.min(...values);
  const normalizedSlope = range > 0 ? Math.abs(slope) / range : 0;

  let direction: TrendDirection;
  let confidence: number;

  if (normalizedSlope < 0.02) {
    direction = "stable";
    confidence = 1 - normalizedSlope * 50;
  } else if (slope > 0) {
    direction = "increasing";
    confidence = Math.min(1, normalizedSlope * 10);
  } else {
    direction = "decreasing";
    confidence = Math.min(1, normalizedSlope * 10);
  }

  return {
    direction,
    confidence: Math.round(confidence * 100) / 100,
  };
}
