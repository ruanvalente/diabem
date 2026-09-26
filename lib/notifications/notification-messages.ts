import {
  NOTIFICATION_PERIOD_LABELS,
  NOTIFICATION_REMINDER_TYPE_ROUTES,
  type NotificationPeriod,
  type NotificationReminderType,
  type NotificationSchedule,
} from "./types";

const TYPE_MESSAGES: Record<NotificationReminderType, string> = {
  glucose: "Lembre-se de registrar sua medição.",
  meal: "Lembre-se de registrar sua alimentação.",
  activity: "Reserve um momento para registrar sua atividade.",
  medication: "Lembre-se de registrar sua medicação.",
  note: "Reserve um momento para registrar uma observação.",
};

const PERIOD_MESSAGES: Record<NotificationPeriod, string> = {
  morning: "Bom dia! Reserve um momento para registrar seus dados de hoje.",
  afternoon: "Reserve um momento para manter seus registros do dia em dia.",
  evening: "Confira seus registros antes de encerrar o dia.",
  night: "Antes de descansar, veja se seus registros estão em dia.",
};

const MAX_TITLE_LENGTH = 40;

export function buildNotificationTitle(
  schedule: Pick<NotificationSchedule, "label" | "period">,
): string {
  const label = schedule.label.trim();
  if (label) return label.slice(0, MAX_TITLE_LENGTH);
  return NOTIFICATION_PERIOD_LABELS[schedule.period];
}

export function buildNotificationBody(
  schedule: Pick<NotificationSchedule, "period" | "reminderTypes">,
): string {
  const sentences = schedule.reminderTypes.map((type) => TYPE_MESSAGES[type]);
  if (sentences.length === 0) return PERIOD_MESSAGES[schedule.period];
  if (sentences.length === 1) return `${PERIOD_MESSAGES[schedule.period]} ${sentences[0]}`;
  const first = sentences.slice(0, -1).join(" ");
  const last = sentences[sentences.length - 1];
  return `${PERIOD_MESSAGES[schedule.period]} ${first} ${last}`;
}

export function resolveNotificationRoute(
  schedule: Pick<NotificationSchedule, "reminderTypes">,
): string {
  const [first] = schedule.reminderTypes;
  return first ? NOTIFICATION_REMINDER_TYPE_ROUTES[first] : "/dashboard";
}

export function buildNotificationTag(scheduleId: string): string {
  return `diabem-reminder-${scheduleId}`;
}
