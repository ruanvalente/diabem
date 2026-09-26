import { describe, expect, it } from "vitest";
import {
  parseNotificationSchedule,
  validateNotificationPreferencesInput,
  validateNotificationScheduleInput,
} from "./notification-schedule.validation";
import {
  NOTIFICATION_WEEKDAY_KEYS,
  type NotificationPreferencesInput,
  type NotificationSchedule,
  type NotificationScheduleInput,
} from "./types";

const validScheduleInput = {
  label: "",
  period: "morning",
  time: "08:00",
  enabled: true,
  daysOfWeek: [...NOTIFICATION_WEEKDAY_KEYS],
  reminderTypes: ["glucose"],
  timeZone: "UTC",
} satisfies NotificationScheduleInput;

const validPreferencesInput = {
  enabled: true,
  quietHours: {
    enabled: true,
    start: "22:00",
    end: "07:00",
  },
  timeZone: "UTC",
} satisfies NotificationPreferencesInput;

const completeSchedule: NotificationSchedule = {
  ...validScheduleInput,
  id: "schedule-1",
  userId: "user-1",
  timeZone: "UTC",
  lastOccurrenceKey: null,
  createdAt: "2026-01-05T07:00:00.000Z",
  updatedAt: "2026-01-05T07:00:00.000Z",
};

describe("validateNotificationScheduleInput", () => {
  it("accepts a valid configuration and returns the data", () => {
    const result = validateNotificationScheduleInput(validScheduleInput);

    expect(result).toEqual({ data: validScheduleInput });
    expect(result.error).toBeUndefined();
  });

  it.each(["8:00", "24:00", "08:60"])("rejects the invalid time %s", (time) => {
    const result = validateNotificationScheduleInput({ ...validScheduleInput, time });

    expect(result.data).toBeUndefined();
    expect(result.error).toBe("Use um horário no formato HH:MM.");
  });

  it("rejects an empty weekday list", () => {
    const result = validateNotificationScheduleInput({
      ...validScheduleInput,
      daysOfWeek: [],
    });

    expect(result.error).toBe("Selecione pelo menos um dia da semana.");
  });

  it("rejects an empty reminder type list", () => {
    const result = validateNotificationScheduleInput({
      ...validScheduleInput,
      reminderTypes: [],
    });

    expect(result.error).toBe("Selecione pelo menos um tipo de lembrete.");
  });

  it("rejects an invalid period", () => {
    const result = validateNotificationScheduleInput({
      ...validScheduleInput,
      period: "invalid",
    });

    expect(result.error).toBe("Selecione um período do dia.");
  });

  it("rejects a label longer than 40 characters", () => {
    const result = validateNotificationScheduleInput({
      ...validScheduleInput,
      label: "a".repeat(41),
    });

    expect(result.error).toBe("Use no máximo 40 caracteres.");
  });

  it("rejects an invalid time zone", () => {
    const result = validateNotificationScheduleInput({
      ...validScheduleInput,
      timeZone: "Mars/Olympus_Mons",
    });

    expect(result.error).toBe("Fuso horário inválido.");
  });
});

describe("validateNotificationPreferencesInput", () => {
  it("accepts valid preferences", () => {
    const result = validateNotificationPreferencesInput(validPreferencesInput);

    expect(result).toEqual({ data: validPreferencesInput });
    expect(result.error).toBeUndefined();
  });

  it.each(["8:00", "25:00"])("rejects the invalid quiet-hours time %s", (time) => {
    const result = validateNotificationPreferencesInput({
      ...validPreferencesInput,
      quietHours: {
        ...validPreferencesInput.quietHours,
        start: time,
      },
    });

    expect(result.data).toBeUndefined();
    expect(result.error).toBe("Use um horário no formato HH:MM.");
  });

  it("rejects an invalid quiet hours end", () => {
    const result = validateNotificationPreferencesInput({
      ...validPreferencesInput,
      quietHours: {
        ...validPreferencesInput.quietHours,
        end: "07:60",
      },
    });

    expect(result.error).toBe("Use um horário no formato HH:MM.");
  });
});

describe("parseNotificationSchedule", () => {
  it.each(["userId", "timeZone"] as const)(
    "rejeita um registro sem o campo obrigatório %s",
    (field) => {
      const record: Partial<NotificationSchedule> = { ...completeSchedule };
      delete record[field];

      expect(() => parseNotificationSchedule(record)).toThrow();
    },
  );

  it("accepts a complete record", () => {
    expect(parseNotificationSchedule(completeSchedule)).toEqual(completeSchedule);
  });
});
