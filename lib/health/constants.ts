import type {
  ActivityType,
  GlucoseContext,
  MealType,
} from "../db/types";

export const GLUCOSE_CONTEXT_LABELS: Record<GlucoseContext, string> = {
  fasting: "Jejum",
  before_meal: "Antes da refeição",
  after_meal: "Após a refeição",
  bedtime: "Antes de dormir",
  other: "Outro",
};

export const GLUCOSE_CONTEXT_ORDER: GlucoseContext[] = [
  "fasting",
  "before_meal",
  "after_meal",
  "bedtime",
  "other",
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Café da manhã",
  lunch: "Almoço",
  dinner: "Jantar",
  snack: "Lanche",
};

export const MEAL_TYPE_ORDER: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  walking: "Caminhada",
  running: "Corrida",
  cycling: "Ciclismo",
  gym: "Academia",
  stretching: "Alongamento",
  swimming: "Natação",
  other: "Outra",
};

export const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  "walking",
  "running",
  "cycling",
  "gym",
  "stretching",
  "swimming",
  "other",
];

export const TIMELINE_EVENT_LABELS = {
  glucose: "Glicemia",
  meal: "Refeição",
  activity: "Atividade física",
  note: "Observação",
} as const;