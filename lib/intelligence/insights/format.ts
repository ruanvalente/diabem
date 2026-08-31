const METRIC_LABELS: Record<string, string> = {
  total_records: "Registros",
  total_glucose_records: "Registros de glicemia",
  average_glucose: "Média de glicemia",
  standard_deviation: "Desvio padrão",
  meal_glucose_relations: "Relações refeição-glicemia",
  activity_glucose_relations: "Relações atividade-glicemia",
  glucose_count: "Registros de glicemia",
  trend_direction: "Tendência",
  time_slot_morning_count: "Registros na manhã",
  time_slot_afternoon_count: "Registros na tarde",
  time_slot_evening_count: "Registros na noite",
  time_slot_night_count: "Registros na madrugada",
};

const UNIT_METRICS: Record<string, string> = {
  average_glucose: "mg/dL",
  standard_deviation: "mg/dL",
};

export function formatMetricLabel(metric: string): string {
  return METRIC_LABELS[metric] ?? metric;
}

export function formatMetricValue(metric: string, value: number): string {
  if (metric === "trend_direction")
    return value > 0 ? "crescente" : value < 0 ? "decrescente" : "estável";
  const unit = UNIT_METRICS[metric];
  return unit ? `${value} ${unit}` : String(value);
}