import { z } from "zod";

export const GLUCOSE_CONTEXT_VALUES = [
  "fasting",
  "before_meal",
  "after_meal",
  "bedtime",
  "other",
] as const;

export const MEAL_TYPE_VALUES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const;

export const ACTIVITY_TYPE_VALUES = [
  "walking",
  "running",
  "cycling",
  "gym",
  "stretching",
  "swimming",
  "other",
] as const;

function isValidDateString(value: string): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

export const createUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    email: z.string().email("E-mail inválido"),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const loginUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome muito longo")
    .optional(),
  email: z.string().email("E-mail inválido").optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

const optionalNotesField = z
  .string()
  .max(500, "Observação muito longa")
  .transform((value) => (value.trim() === "" ? "" : value))
  .optional();

export const glucoseReadingSchema = z.object({
  value: z
    .number({ error: "Informe um valor numérico" })
    .positive("Informe um valor maior que zero")
    .max(1000, "Informe um valor de glicemia válido"),
  unit: z.literal("mg/dL", { message: "Unidade inválida" }).default("mg/dL"),
  context: z.enum(GLUCOSE_CONTEXT_VALUES, {
    message: "Contexto inválido",
  }),
  measuredAt: z
    .string()
    .refine(isValidDateString, { message: "Data e horário inválidos" }),
  notes: optionalNotesField,
});

export type GlucoseReadingInput = z.infer<typeof glucoseReadingSchema>;

export const mealSchema = z.object({
  type: z.enum(MEAL_TYPE_VALUES, { message: "Tipo de refeição inválido" }),
  description: z
    .string()
    .trim()
    .min(2, "Descreva o que você comeu")
    .max(500, "Descrição muito longa"),
  consumedAt: z
    .string()
    .refine(isValidDateString, { message: "Data e horário inválidos" }),
  notes: optionalNotesField,
});

export type MealInput = z.infer<typeof mealSchema>;

export const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPE_VALUES, { message: "Tipo de atividade inválido" }),
  durationMinutes: z
    .number({ error: "Informe um valor numérico" })
    .int("Duração deve ser um número inteiro")
    .min(1, "Duração deve ser de ao menos 1 minuto")
    .max(1440, "Duração não pode exceder 24 horas"),
  startedAt: z
    .string()
    .refine(isValidDateString, { message: "Data e horário inválidos" }),
  notes: optionalNotesField,
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const noteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Escreva sua observação")
    .max(2000, "Observação muito longa"),
});

export type NoteInput = z.infer<typeof noteSchema>;
