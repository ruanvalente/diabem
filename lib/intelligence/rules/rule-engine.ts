import type {
  IntelligenceRule,
  RuleContext,
  Pattern,
} from "../types/rule.types";
import { insufficientDataRule } from "./insufficient-data.rule";
import { timeConcentrationRule } from "./time-concentration.rule";
import { averageChangeRule } from "./average-change.rule";
import { increasedVariabilityRule } from "./increased-variability.rule";
import { mealGlucoseRelationRule } from "./meal-glucose-relation.rule";
import { activityGlucoseRelationRule } from "./activity-glucose-relation.rule";
import { trendDetectedRule } from "./trend-detected.rule";

const ALL_RULES: IntelligenceRule[] = [
  insufficientDataRule,
  timeConcentrationRule,
  averageChangeRule,
  increasedVariabilityRule,
  mealGlucoseRelationRule,
  activityGlucoseRelationRule,
  trendDetectedRule,
];

export function evaluateAllRules(
  context: RuleContext
): Pattern[] {
  const patterns: Pattern[] = [];

  for (const rule of ALL_RULES) {
    const result = rule.evaluate(context);
    if (result) {
      patterns.push(...result.patterns);
    }
  }

  return patterns;
}

export function getRules(): readonly IntelligenceRule[] {
  return ALL_RULES;
}
