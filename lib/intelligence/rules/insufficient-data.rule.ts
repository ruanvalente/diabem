import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import {
  glucoseInPeriod,
  mealsInPeriod,
  activitiesInPeriod,
  recordIds,
} from "./rule-helpers";

const MIN_RECORDS_FOR_ANALYSIS = 10;

export const insufficientDataRule: IntelligenceRule = {
  id: "insufficient-data",
  version: "1.0.0",
  description: "Checks if there are enough records for meaningful analysis",

  evaluate(context: RuleContext): RuleResult | null {
    if (context.dataQuality.totalRecords >= MIN_RECORDS_FOR_ANALYSIS) {
      return null;
    }

    const sourceIds = recordIds([
      ...glucoseInPeriod(context.records.glucose, context.period),
      ...mealsInPeriod(context.records.meals, context.period),
      ...activitiesInPeriod(context.records.activities, context.period),
    ]);

    return {
      patterns: [
        createPattern(
          "insufficient-data",
          "insufficient_data",
          "notice",
          [
            {
              metric: "total_records",
              value: context.dataQuality.totalRecords,
              comparison: MIN_RECORDS_FOR_ANALYSIS,
              period: context.period,
              sourceIds,
            },
          ],
          undefined,
          {
            ruleVersion: "1.0.0",
            title: "Dados insuficientes",
            explanation: `Foram encontrados ${context.dataQuality.totalRecords} registros no período. É necessário um mínimo de ${MIN_RECORDS_FOR_ANALYSIS} para identificar padrões.`,
            sourceIds,
          }
        ),
      ],
    };
  },
};