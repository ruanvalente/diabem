import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import { mealsInPeriod, recordIds } from "./rule-helpers";

const MIN_RELATIONS_FOR_RULE = 3;

export const mealGlucoseRelationRule: IntelligenceRule = {
  id: "meal-glucose-relation",
  version: "1.0.0",
  description: "Detects if there are sufficient meal-glucose temporal relations",

  evaluate(context: RuleContext): RuleResult | null {
    const relations = context.analytics.mealGlucoseRelations;
    const withData = relations.filter(
      (r) => r.glucoseBefore || r.glucoseAfter
    );

    if (withData.length < MIN_RELATIONS_FOR_RULE) return null;

    const sourceIds = withData.flatMap((r) => {
      const ids = [r.mealId];
      if (r.glucoseBefore) ids.push(r.glucoseBefore.id);
      if (r.glucoseAfter) ids.push(r.glucoseAfter.id);
      return ids;
    });

    const mealIds = recordIds(mealsInPeriod(context.records.meals, context.period));

    return {
      patterns: [
        createPattern(
          "meal-glucose-relation",
          "meal_glucose_data_available",
          "info",
          [
            {
              metric: "meal_glucose_relations",
              value: withData.length,
              period: context.period,
              sourceIds,
            },
            {
              metric: "total_meals",
              value: mealIds.length,
              period: context.period,
              sourceIds: mealIds,
            },
          ],
          undefined,
          {
            ruleVersion: "1.0.0",
            title: "Registros próximos a refeições",
            explanation: `${withData.length} refeições possuem medições de glicemia próximas aos horários consumidos.`,
            sourceIds,
          }
        ),
      ],
    };
  },
};