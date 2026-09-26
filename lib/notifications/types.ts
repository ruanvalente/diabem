export const NOTIFICATION_PERIODS = ["morning", "afternoon", "evening", "night"] as const;

export type NotificationPeriod = (typeof NOTIFICATION_PERIODS)[number];

export const NOTIFICATION_PERIOD_LABELS: Record<NotificationPeriod, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  night: "Madrugada",
};

export const NOTIFICATION_PERIOD_DEFAULT_TIMES: Record<NotificationPeriod, string> = {
  morning: "08:00",
  afternoon: "12:00",
  evening: "17:00",
  night: "20:00",
};

export const NOTIFICATION_REMINDER_TYPES = [
  "glucose",
  "meal",
  "activity",
  "medication",
  "note",
] as const;

export type NotificationReminderType = (typeof NOTIFICATION_REMINDER_TYPES)[number];

export const NOTIFICATION_REMINDER_TYPE_LABELS: Record<NotificationReminderType, string> = {
  glucose: "Medições",
  meal: "Alimentação",
  activity: "Atividades",
  medication: "Medicamentos",
  note: "Observações",
};

export const NOTIFICATION_REMINDER_TYPE_ROUTES: Record<NotificationReminderType, string> = {
  glucose: "/glucose",
  meal: "/meals",
  activity: "/activity",
  medication: "/medications",
  note: "/notes",
};

export const NOTIFICATION_WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type NotificationWeekdayKey = (typeof NOTIFICATION_WEEKDAY_KEYS)[number];

export const NOTIFICATION_WEEKDAY_LABELS: Record<NotificationWeekdayKey, string> = {
  sunday: "Domingo",
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
};

export const NOTIFICATION_WEEKDAY_SHORT_LABELS: Record<NotificationWeekdayKey, string> = {
  sunday: "Dom",
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
};

export type NotificationWeekdayPreset = "everyDay" | "weekdays" | "weekend" | "custom";

export const NOTIFICATION_WEEKDAY_PRESETS: Record<
  Exclude<NotificationWeekdayPreset, "custom">,
  NotificationWeekdayKey[]
> = {
  everyDay: [...NOTIFICATION_WEEKDAY_KEYS],
  weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  weekend: ["saturday", "sunday"],
};

export const NOTIFICATION_WEEKDAY_PRESET_LABELS: Record<NotificationWeekdayPreset, string> = {
  everyDay: "Todos os dias",
  weekdays: "Dias úteis",
  weekend: "Fim de semana",
  custom: "Personalizado",
};

export type NotificationSchedule = {
  id: string;
  userId: string;
  label: string;
  period: NotificationPeriod;
  time: string;
  enabled: boolean;
  daysOfWeek: NotificationWeekdayKey[];
  reminderTypes: NotificationReminderType[];
  timeZone: string;
  lastOccurrenceKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationQuietHours = {
  enabled: boolean;
  start: string;
  end: string;
};

export const NOTIFICATION_DEFAULT_QUIET_HOURS: NotificationQuietHours = {
  enabled: false,
  start: "22:00",
  end: "07:00",
};

export type NotificationPreferences = {
  userId: string;
  enabled: boolean;
  quietHours: NotificationQuietHours;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationScheduleInput = {
  label: string;
  period: NotificationPeriod;
  time: string;
  enabled: boolean;
  daysOfWeek: NotificationWeekdayKey[];
  reminderTypes: NotificationReminderType[];
  timeZone?: string;
};

export type NotificationPreferencesInput = {
  enabled: boolean;
  quietHours: NotificationQuietHours;
  timeZone?: string;
};

export type NotificationRuntimeStatus = "idle" | "running" | "error";

export type NotificationActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type NotificationSchedulerSnapshot = {
  status: NotificationRuntimeStatus;
  activeScheduleIds: string[];
  nextOccurrence: { scheduleId: string; at: string } | null;
  lastError: string | null;
};
