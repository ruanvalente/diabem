import { z } from "zod";
import {
  NOTIFICATION_PERIODS,
  NOTIFICATION_REMINDER_TYPES,
  NOTIFICATION_WEEKDAY_KEYS,
  type NotificationPreferencesInput,
  type NotificationScheduleInput,
  type NotificationSchedule,
} from "./types";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeSchema = z
  .string()
  .regex(TIME_PATTERN, "Use um horário no formato HH:MM.");

export const timeZoneSchema = z
  .string()
  .min(1, "Informe o fuso horário.")
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("pt-BR", { timeZone: value }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }, "Fuso horário inválido.");

const weekDaysSchema = z
  .array(z.enum(NOTIFICATION_WEEKDAY_KEYS))
  .min(1, "Selecione pelo menos um dia da semana.");

const reminderTypesSchema = z
  .array(z.enum(NOTIFICATION_REMINDER_TYPES))
  .min(1, "Selecione pelo menos um tipo de lembrete.");

export const notificationScheduleInputSchema = z.object({
  label: z
    .string()
    .trim()
    .max(40, "Use no máximo 40 caracteres.")
    .optional()
    .default(""),
  period: z.enum(NOTIFICATION_PERIODS, {
    message: "Selecione um período do dia.",
  }),
  time: timeSchema,
  enabled: z.boolean(),
  daysOfWeek: weekDaysSchema,
  reminderTypes: reminderTypesSchema,
  timeZone: timeZoneSchema.optional(),
});

export const notificationPreferencesInputSchema = z.object({
  enabled: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: timeSchema,
    end: timeSchema,
  }),
  timeZone: timeZoneSchema.optional(),
});

export const notificationScheduleSchema = notificationScheduleInputSchema.extend({
  id: z.string().min(1),
  userId: z.string().min(1, "Usuário inválido."),
  label: z.string().trim().max(40, "Use no máximo 40 caracteres."),
  timeZone: timeZoneSchema,
  lastOccurrenceKey: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const notificationPreferencesSchema = z.object({
  userId: z.string().min(1, "Usuário inválido."),
  enabled: z.boolean(),
  quietHours: z.object({
    enabled: z.boolean(),
    start: timeSchema,
    end: timeSchema,
  }),
  timeZone: timeZoneSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type NotificationScheduleValidation = {
  data?: NotificationScheduleInput;
  error?: string;
};

export type NotificationPreferencesValidation = {
  data?: NotificationPreferencesInput;
  error?: string;
};

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Configuração inválida.";
}

export function validateNotificationScheduleInput(
  input: unknown,
): NotificationScheduleValidation {
  const parsed = notificationScheduleInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return { data: parsed.data };
}

export function validateNotificationPreferencesInput(
  input: unknown,
): NotificationPreferencesValidation {
  const parsed = notificationPreferencesInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  return { data: parsed.data };
}

export function parseNotificationSchedule(value: unknown): NotificationSchedule {
  return notificationScheduleSchema.parse(value);
}
