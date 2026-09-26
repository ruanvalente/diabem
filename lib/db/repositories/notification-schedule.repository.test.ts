import { beforeEach, describe, expect, it } from "vitest";
import {
  NOTIFICATION_DEFAULT_QUIET_HOURS,
  NOTIFICATION_WEEKDAY_KEYS,
  type NotificationPreferencesInput,
  type NotificationScheduleInput,
} from "../../notifications/types";
import { resolveTimeZone } from "../../notifications/notification-recurrence";
import { getDatabase } from "../database";
import { notificationScheduleRepository } from "./notification-schedule.repository";

function createInput(
  overrides: Partial<NotificationScheduleInput> = {},
): NotificationScheduleInput {
  return {
    label: "Lembrete da manhã",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: [...NOTIFICATION_WEEKDAY_KEYS],
    reminderTypes: ["glucose"],
    ...overrides,
  };
}

beforeEach(async () => {
  const database = getDatabase();
  await database.notificationSchedules.clear();
  await database.notificationPreferences.clear();
});

describe("notificationScheduleRepository", () => {
  it("creates a schedule with identity, scope, timestamps and default time zone", async () => {
    const record = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );

    expect(record.id).toBeTruthy();
    expect(record.userId).toBe("user-a");
    expect(record.label).toBe("Lembrete da manhã");
    expect(record.daysOfWeek).toEqual([...NOTIFICATION_WEEKDAY_KEYS]);
    expect(record.reminderTypes).toEqual(["glucose"]);
    expect(record.timeZone).toBe(resolveTimeZone());
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBe(record.createdAt);
    expect(record.lastOccurrenceKey).toBeNull();
  });

  it("does not find a schedule from another user", async () => {
    const record = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );

    await expect(
      notificationScheduleRepository.findById("user-b", record.id),
    ).resolves.toBeUndefined();
  });

  it("isolates schedules per user and sorts them by time", async () => {
    await notificationScheduleRepository.create(
      "user-a",
      createInput({ time: "18:00" }),
    );
    await notificationScheduleRepository.create(
      "user-a",
      createInput({ time: "08:00" }),
    );
    await notificationScheduleRepository.create(
      "user-b",
      createInput({ time: "07:00" }),
    );

    const records = await notificationScheduleRepository.findByUser("user-a");

    expect(records).toHaveLength(2);
    expect(records.map((record) => record.time)).toEqual(["08:00", "18:00"]);
  });

  it("returns only enabled schedules", async () => {
    const enabled = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );
    await notificationScheduleRepository.create(
      "user-a",
      createInput({ enabled: false }),
    );

    const records =
      await notificationScheduleRepository.getEnabledSchedules("user-a");

    expect(records.map((record) => record.id)).toEqual([enabled.id]);
  });

  it("merges a partial update and bumps updatedAt", async () => {
    const created = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updated = await notificationScheduleRepository.update(
      "user-a",
      created.id,
      { time: "09:15", reminderTypes: ["meal"] },
    );

    expect(updated).toMatchObject({
      id: created.id,
      label: created.label,
      period: "morning",
      time: "09:15",
      daysOfWeek: created.daysOfWeek,
      reminderTypes: ["meal"],
      createdAt: created.createdAt,
    });
    expect(updated?.updatedAt).not.toBe(created.updatedAt);
  });

  it("rejects an invalid update without persisting the change", async () => {
    const created = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );

    await expect(
      notificationScheduleRepository.update("user-a", created.id, { time: "8:00" }),
    ).rejects.toThrow("Use um horário no formato HH:MM.");

    const unchanged = await notificationScheduleRepository.findById(
      "user-a",
      created.id,
    );
    expect(unchanged?.time).toBe("08:00");
  });

  it("changes the enabled state of the schedule", async () => {
    const created = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );

    const disabled = await notificationScheduleRepository.setEnabled(
      "user-a",
      created.id,
      false,
    );

    expect(disabled?.enabled).toBe(false);
    await expect(
      notificationScheduleRepository.getEnabledSchedules("user-a"),
    ).resolves.toEqual([]);
  });

  it("marks the last occurrence of the schedule", async () => {
    const created = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );

    await notificationScheduleRepository.markOccurrence(
      "user-a",
      created.id,
      "schedule-occurrence",
    );

    const updated = await notificationScheduleRepository.findById(
      "user-a",
      created.id,
    );
    expect(updated?.lastOccurrenceKey).toBe("schedule-occurrence");
  });

  it("refuses to delete an id owned by another user", async () => {
    const created = await notificationScheduleRepository.create(
      "user-a",
      createInput(),
    );

    await expect(
      notificationScheduleRepository.deleteById("user-b", created.id),
    ).resolves.toBe(false);
    await expect(
      notificationScheduleRepository.findById("user-a", created.id),
    ).resolves.toBeDefined();
  });

  it("deletes only the schedules of the requested user", async () => {
    await notificationScheduleRepository.create("user-a", createInput());
    await notificationScheduleRepository.create("user-a", createInput());
    await notificationScheduleRepository.create("user-b", createInput());

    await expect(
      notificationScheduleRepository.deleteAll("user-a"),
    ).resolves.toBe(2);
    await expect(
      notificationScheduleRepository.findByUser("user-a"),
    ).resolves.toEqual([]);
    await expect(
      notificationScheduleRepository.findByUser("user-b"),
    ).resolves.toHaveLength(1);
  });

  it("creates the default preferences only once", async () => {
    const first = await notificationScheduleRepository.getPreferences("user-a");
    const second = await notificationScheduleRepository.getPreferences("user-a");

    expect(first).toMatchObject({
      userId: "user-a",
      enabled: false,
      quietHours: NOTIFICATION_DEFAULT_QUIET_HOURS,
      timeZone: resolveTimeZone(),
    });
    expect(second).toEqual(first);
    await expect(
      getDatabase().notificationPreferences.count(),
    ).resolves.toBe(1);
  });

  it("persists preferences and bumps updatedAt", async () => {
    const original = await notificationScheduleRepository.getPreferences("user-a");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const input: NotificationPreferencesInput = {
      enabled: true,
      quietHours: {
        enabled: true,
        start: "21:30",
        end: "06:15",
      },
      timeZone: "UTC",
    };

    const updated = await notificationScheduleRepository.updatePreferences(
      "user-a",
      input,
    );

    expect(updated).toMatchObject({
      ...input,
      userId: "user-a",
      createdAt: original.createdAt,
    });
    expect(updated.updatedAt).not.toBe(original.updatedAt);
  });

  it("rejects an invalid time in the preferences", async () => {
    await expect(
      notificationScheduleRepository.updatePreferences("user-a", {
        enabled: true,
        quietHours: {
          enabled: true,
          start: "25:00",
          end: "07:00",
        },
        timeZone: "UTC",
      }),
    ).rejects.toThrow("Use um horário no formato HH:MM.");
  });
});
