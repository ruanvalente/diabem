import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import { activitiesInPeriod, recordIds } from "./rule-helpers";

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

    const sourceIds = withData.flatMap((r) => {
      const ids = [r.activityId];
      if (r.glucoseBefore) ids.push(r.glucoseBefore.id);
      if (r.glucoseAfter) ids.push(r.glucoseAfter.id);
      return ids;
    });

    const activityIds = recordIds(
      activitiesInPeriod(context.records.activities, context.period)
    );

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
              sourceIds,
            },
            {
              metric: "total_activities",
              value: activityIds.length,
              period: context.period,
              sourceIds: activityIds,
            },
          ],
          undefined,
          {
            ruleVersion: "1.0.0",
            title: "Registros após atividades",
            explanation: `${withData.length} atividades possuem medições de glicemia próximas ao período de exercício.`,
            sourceIds,
          }
        ),
      ],
    };
  },
};