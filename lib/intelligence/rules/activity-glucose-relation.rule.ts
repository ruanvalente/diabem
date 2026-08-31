import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";

const MIN_RELATIONS_FOR_RULE = 3;

export const activityGlucoseRelationRule: IntelligenceRule = {
  id: "activity-glucose-relation",
  version: "1.0.0",
  description: "Detects if there are sufficient activity-glucose temporal relations",

  evaluate(context: RuleContext): RuleResult | null {
    const relations = context.analytics.activityGlucoseRelations;
    const withData = relations.filter(
      (r) => r.glucoseBefore || r.glucoseAfter
    );

    if (withData.length < MIN_RELATIONS_FOR_RULE) return null;

    return {
      patterns: [
        createPattern(
          "activity-glucose-relation",
          "activity_glucose_data_available",
          "info",
          [
            {
              metric: "activity_glucose_relations",
              value: withData.length,
              period: context.period,
            },
          ]
        ),
      ],
    };
  },
};
