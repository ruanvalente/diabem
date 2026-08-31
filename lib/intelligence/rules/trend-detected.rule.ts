import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";

export const trendDetectedRule: IntelligenceRule = {
  id: "trend-detected",
  version: "1.0.0",
  description: "Detects glucose trend direction when data is sufficient",

  evaluate(context: RuleContext): RuleResult | null {
    const trend = context.analytics.glucoseTrend;
    if (!trend || trend.direction === "insufficient_data") return null;

    const glucose = context.analytics.glucose;
    if (!glucose || glucose.stats.count < 5) return null;

    return {
      patterns: [
        createPattern(
          "trend-detected",
          "trend_detected",
          "info",
          [
            {
              metric: "trend_direction",
              value: trend.direction === "increasing" ? 1 : trend.direction === "decreasing" ? -1 : 0,
              period: context.period,
            },
            {
              metric: "glucose_count",
              value: glucose.stats.count,
              period: context.period,
            },
          ],
          trend.confidence
        ),
      ],
    };
  },
};
