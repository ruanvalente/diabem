import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";

const CONCENTRATION_THRESHOLD = 0.5;

export const timeConcentrationRule: IntelligenceRule = {
  id: "time-concentration",
  version: "1.0.0",
  description: "Detects if a significant portion of glucose records concentrate in one time of day",

  evaluate(context: RuleContext): RuleResult | null {
    const glucose = context.analytics.glucose;
    if (!glucose || glucose.stats.count < 5) return null;

    const maxSlot = glucose.byTimeOfDay.reduce((max, slot) =>
      slot.count > max.count ? slot : max
    );

    if (maxSlot.count === 0) return null;

    const concentration = maxSlot.count / glucose.stats.count;
    if (concentration < CONCENTRATION_THRESHOLD) return null;

    return {
      patterns: [
        createPattern(
          "time-concentration",
          "time_concentration",
          "info",
          [
            {
              metric: `time_slot_${maxSlot.period}_count`,
              value: maxSlot.count,
              period: context.period,
            },
            {
              metric: "total_glucose_records",
              value: glucose.stats.count,
              period: context.period,
            },
          ],
          concentration
        ),
      ],
    };
  },
};
