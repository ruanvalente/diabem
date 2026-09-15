import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import { glucoseInPeriod, recordIds } from "./rule-helpers";

const AVERAGE_CHANGE_THRESHOLD_PERCENT = 10;

export const averageChangeRule: IntelligenceRule = {
  id: "average-change",
  version: "1.0.0",
  description: "Detects significant average change between periods",

  evaluate(context: RuleContext): RuleResult | null {
    const comparisons = context.analytics.comparisons;
    if (!comparisons?.average) return null;

    const { average } = comparisons;
    if (average.percentageDifference === undefined) return null;

    const absPercent = Math.abs(average.percentageDifference);
    if (absPercent < AVERAGE_CHANGE_THRESHOLD_PERCENT) return null;

    const records = glucoseInPeriod(context.records.glucose, context.period);
    const ids = recordIds(records);

    const direction = average.percentageDifference > 0 ? "aumento" : "queda";

    return {
      patterns: [
        createPattern(
          "average-change",
          "average_change",
          "info",
          [
            {
              metric: "average_glucose",
              value: average.current,
              comparison: average.previous,
              period: context.period,
              sourceIds: ids,
            },
          ],
          Math.min(1, absPercent / 50),
          {
            ruleVersion: "1.0.0",
            title: "Mudança na média",
            explanation: `A média de glicemia ${direction} de ${average.previous.toFixed(0)} para ${average.current.toFixed(0)} mg/dL em relação ao período anterior.`,
            sourceIds: ids,
          }
        ),
      ],
    };
  },
};