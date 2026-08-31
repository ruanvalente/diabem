import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";

const MIN_RECORDS_FOR_ANALYSIS = 10;

export const insufficientDataRule: IntelligenceRule = {
  id: "insufficient-data",
  version: "1.0.0",
  description: "Checks if there are enough records for meaningful analysis",

  evaluate(context: RuleContext): RuleResult | null {
    if (context.dataQuality.totalRecords >= MIN_RECORDS_FOR_ANALYSIS) {
      return null;
    }

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
            },
          ]
        ),
      ],
    };
  },
};
