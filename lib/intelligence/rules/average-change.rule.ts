import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";

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
            },
          ],
          Math.min(1, absPercent / 50)
        ),
      ],
    };
  },
};
