import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";

export const increasedVariabilityRule: IntelligenceRule = {
  id: "increased-variability",
  version: "1.0.0",
  description: "Detects increased variability compared to previous period",

  evaluate(context: RuleContext): RuleResult | null {
    const variability = context.analytics.glucoseVariability;
    const comparisons = context.analytics.comparisons;

    if (!variability?.standardDeviation || !comparisons?.average) return null;

    const currentSD = variability.standardDeviation;

    if (comparisons.average.previous > 0) {
      const previousSD = comparisons.average.previous * 0.2;
      if (currentSD > previousSD * 1.5) {
        return {
          patterns: [
            createPattern(
              "increased-variability",
              "increased_variability",
              "notice",
              [
                {
                  metric: "standard_deviation",
                  value: currentSD,
                  comparison: previousSD,
                  period: context.period,
                },
              ]
            ),
          ],
        };
      }
    }

    return null;
  },
};
