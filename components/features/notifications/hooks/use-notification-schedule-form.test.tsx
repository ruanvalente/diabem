// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";

import type { NotificationSchedule } from "@/lib/notifications/types";
import { useNotificationScheduleForm } from "./use-notification-schedule-form";

function schedule(overrides: Partial<NotificationSchedule> = {}): NotificationSchedule {
  return {
    id: "sched-1",
    userId: "user-a",
    label: "Medição da manhã",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: ["monday", "friday"],
    reminderTypes: ["glucose"],
    timeZone: "America/Belem",
    lastOccurrenceKey: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("useNotificationScheduleForm", () => {
  it("starts a new reminder on the morning period with its default time", () => {
    const { result } = renderHook(() => useNotificationScheduleForm(null));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.value).toEqual({
      label: "",
      period: "morning",
      time: "08:00",
      enabled: true,
      daysOfWeek: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      reminderTypes: ["glucose"],
    });
    expect(result.current.weekdayPreset).toBe("everyDay");
  });

  it("prefills the form from the reminder being edited", () => {
    const { result } = renderHook(() => useNotificationScheduleForm(schedule()));

    expect(result.current.isEditing).toBe(true);
    expect(result.current.value).toEqual({
      label: "Medição da manhã",
      period: "morning",
      time: "08:00",
      enabled: true,
      daysOfWeek: ["monday", "friday"],
      reminderTypes: ["glucose"],
    });
    expect(result.current.weekdayPreset).toBe("custom");
  });

  it("adopts the default time of the chosen period while creating", () => {
    const { result } = renderHook(() => useNotificationScheduleForm(null));

    act(() => result.current.change({ ...result.current.value, period: "evening" }));

    expect(result.current.value.period).toBe("evening");
    expect(result.current.value.time).toBe("17:00");
  });

  it("keeps the stored time when the period changes while editing", () => {
    const { result } = renderHook(() =>
      useNotificationScheduleForm(schedule({ time: "06:15" })),
    );

    act(() => result.current.change({ ...result.current.value, period: "night" }));

    expect(result.current.value.period).toBe("night");
    expect(result.current.value.time).toBe("06:15");
  });

  it("derives the recurrence from the edited days", () => {
    const { result } = renderHook(() => useNotificationScheduleForm(null));

    act(() => result.current.change({ ...result.current.value, daysOfWeek: ["saturday", "sunday"] }));

    expect(result.current.weekdayPreset).toBe("weekend");
  });

  it("replaces the days with the chosen preset", () => {
    const { result } = renderHook(() =>
      useNotificationScheduleForm(schedule()),
    );

    act(() => result.current.changeWeekdayPreset("weekdays"));

    expect(result.current.weekdayPreset).toBe("weekdays");
    expect(result.current.value.daysOfWeek).toEqual([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
  });

  it("keeps the current days when the recurrence becomes custom", () => {
    const { result } = renderHook(() =>
      useNotificationScheduleForm(schedule({ daysOfWeek: ["monday", "friday"] })),
    );

    act(() => result.current.changeWeekdayPreset("custom"));

    expect(result.current.weekdayPreset).toBe("custom");
    expect(result.current.value.daysOfWeek).toEqual(["monday", "friday"]);
  });
});
