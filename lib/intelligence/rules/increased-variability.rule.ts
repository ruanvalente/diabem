import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import { glucoseInPeriod, recordIds } from "./rule-helpers";

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
        const records = glucoseInPeriod(context.records.glucose, context.period);
        const ids = recordIds(records);

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
                  sourceIds: ids,
                },
              ],
              undefined,
              {
                ruleVersion: "1.0.0",
                title: "Variabilidade nos registros",
                explanation: `O desvio padrão das medições de glicemia (${currentSD.toFixed(1)} mg/dL) está maior do que o esperado para o período.`,
                sourceIds: ids,
              }
            ),
          ],
        };
      }
    }

    return null;
  },
};