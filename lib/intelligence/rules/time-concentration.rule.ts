import type { IntelligenceRule, RuleContext, RuleResult } from "../types/rule.types";
import { createPattern } from "./pattern-factory";
import { glucoseInPeriod, recordIds } from "./rule-helpers";

const CONCENTRATION_THRESHOLD = 0.5;

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: "manhã",
  afternoon: "tarde",
  evening: "noite",
  night: "madrugada",
};

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

    const records = glucoseInPeriod(context.records.glucose, context.period);
    const ids = recordIds(records);

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
              sourceIds: ids,
            },
            {
              metric: "total_glucose_records",
              value: glucose.stats.count,
              period: context.period,
              sourceIds: ids,
            },
          ],
          concentration,
          {
            ruleVersion: "1.0.0",
            title: "Concentração de registros",
            explanation: `${maxSlot.count} de ${glucose.stats.count} medições estão concentradas no período da ${TIME_SLOT_LABELS[maxSlot.period] ?? maxSlot.period}.`,
            sourceIds: ids,
          }
        ),
      ],
    };
  },
};