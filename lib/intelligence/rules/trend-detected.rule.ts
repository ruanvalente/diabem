import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import { glucoseInPeriod, recordIds } from "./rule-helpers";

const TREND_LABELS: Record<string, string> = {
  increasing: "aumento",
  decreasing: "queda",
  stable: "estabilidade",
};

export const trendDetectedRule: IntelligenceRule = {
  id: "trend-detected",
  version: "1.0.0",
  description: "Detects glucose trend direction when data is sufficient",

  evaluate(context: RuleContext): RuleResult | null {
    const trend = context.analytics.glucoseTrend;
    if (!trend || trend.direction === "insufficient_data") return null;

    const glucose = context.analytics.glucose;
    if (!glucose || glucose.stats.count < 5) return null;

    const records = glucoseInPeriod(context.records.glucose, context.period);
    const ids = recordIds(records);

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
              sourceIds: ids,
            },
            {
              metric: "glucose_count",
              value: glucose.stats.count,
              period: context.period,
              sourceIds: ids,
            },
          ],
          trend.confidence,
          {
            ruleVersion: "1.0.0",
            title: "Tendência identificada",
            explanation: `Foi identificada ${TREND_LABELS[trend.direction] ?? "uma tendência"} nos registros de glicemia do período analisado, com base em ${glucose.stats.count} medições.`,
            sourceIds: ids,
          }
        ),
      ],
    };
  },
};