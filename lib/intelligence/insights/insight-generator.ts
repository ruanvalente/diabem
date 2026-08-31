import type { Insight, InsightPriority } from "../types/insight.types";
import type { Pattern } from "../types/rule.types";

const INSIGHT_LABELS: Record<string, { title: string; description: string }> = {
  insufficient_data: {
    title: "Dados insuficientes",
    description:
      "Ainda não existem dados suficientes para identificar padrões. Continue registrando suas informações.",
  },
  time_concentration: {
    title: "Concentração de registros",
    description:
      "Seus registros apresentam maior concentração em um período específico do dia.",
  },
  average_change: {
    title: "Mudança na média",
    description:
      "Foi identificada uma variação na média dos seus registros em relação ao período anterior.",
  },
  increased_variability: {
    title: "Variabilidade nos registros",
    description:
      "Seus registros apresentaram maior variabilidade durante o período analisado.",
  },
  meal_glucose_data_available: {
    title: "Registros próximos a refeições",
    description:
      "Existem registros de glicemia próximos aos horários de refeição nos seus dados.",
  },
  activity_glucose_data_available: {
    title: "Registros após atividades",
    description:
      "Existem registros de glicemia após períodos de atividade física nos seus dados.",
  },
  trend_detected: {
    title: "Tendência identificada",
    description:
      "Foi identificada uma tendência nos seus registros ao longo do período analisado.",
  },
};

const PRIORITY_MAP: Record<string, InsightPriority> = {
  insufficient_data: "low",
  time_concentration: "low",
  average_change: "medium",
  increased_variability: "medium",
  meal_glucose_data_available: "low",
  activity_glucose_data_available: "low",
  trend_detected: "medium",
};

export function generateInsights(
  patterns: Pattern[],
  generatedAt = new Date().toISOString()
): Insight[] {
  const insights: Insight[] = [];

  for (const [index, pattern] of patterns.entries()) {
    const template = INSIGHT_LABELS[pattern.type];
    if (!template) continue;

    const priority = PRIORITY_MAP[pattern.type] ?? "low";

    insights.push({
      id: `ins-${pattern.ruleId}-${index}`,
      type: pattern.type === "insufficient_data" ? "insufficient_data" : "observation",
      priority,
      title: template.title,
      description: template.description,
      evidence: pattern.evidence,
      generatedAt,
    });
  }

  return insights;
}
