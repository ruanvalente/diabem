import type { BasicStats } from "../types/analytics.types";

export function calculateCount(values: number[]): number {
  return values.length;
}

export function calculateAverage(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

export function calculateMedian(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;
  }
  return sorted[mid];
}

export function calculateMin(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return Math.min(...values);
}

export function calculateMax(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return Math.max(...values);
}

export function calculateStandardDeviation(values: number[]): number | undefined {
  if (values.length < 2) return undefined;
  const avg = calculateAverage(values);
  if (avg === undefined) return undefined;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.round(Math.sqrt(avgSquareDiff) * 100) / 100;
}

export function calculateBasicStats(values: number[]): BasicStats {
  return {
    count: calculateCount(values),
    average: calculateAverage(values),
    median: calculateMedian(values),
    minimum: calculateMin(values),
    maximum: calculateMax(values),
    standardDeviation: calculateStandardDeviation(values),
  };
}

export function calculateCoefficientOfVariation(
  values: number[]
): number | undefined {
  if (values.length < 2) return undefined;
  const avg = calculateAverage(values);
  const sd = calculateStandardDeviation(values);
  if (avg === undefined || sd === undefined || avg === 0) return undefined;
  return Math.round((sd / avg) * 10000) / 100;
}
