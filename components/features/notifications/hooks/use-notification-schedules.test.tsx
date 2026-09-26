// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/notifications/notification-scheduler.service", () => ({
  getNotificationScheduler: () => ({
    schedule: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    reload: vi.fn(async () => {}),
  }),
}));

import { useNotificationSchedules } from "./use-notification-schedules";
import { getDatabase } from "@/lib/db/database";
import { notificationScheduleRepository } from "@/lib/db/repositories/notification-schedule.repository";
import type { NotificationScheduleInput } from "@/lib/notifications/types";

function input(
  overrides: Partial<NotificationScheduleInput> = {},
): NotificationScheduleInput {
  return {
    label: "Medição da manhã",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    reminderTypes: ["glucose"],
    ...overrides,
  };
}

beforeEach(async () => {
  const database = getDatabase();
  await database.notificationSchedules.clear();
  await database.notificationPreferences.clear();
});

describe("useNotificationSchedules", () => {
  it("loads the current user's reminders from IndexedDB", async () => {
    await notificationScheduleRepository.create("user-a", input());
    await notificationScheduleRepository.create("user-b", input({ label: "Outro" }));

    const { result } = renderHook(() => useNotificationSchedules("user-a"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.schedules).toHaveLength(1);
    expect(result.current.schedules[0].label).toBe("Medição da manhã");
    expect(result.current.error).toBeNull();
  });

  it("starts loading and exposes nothing while there is no session", () => {
    const { result } = renderHook(() => useNotificationSchedules(null));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.schedules).toEqual([]);
  });

  it("persists a created reminder and re-sorts the list", async () => {
    await notificationScheduleRepository.create("user-a", input({ time: "20:00" }));
    const { result } = renderHook(() => useNotificationSchedules("user-a"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const created = await result.current.create(input({ time: "07:30" }));
      expect(created.ok).toBe(true);
    });

    expect(result.current.schedules.map((s) => s.time)).toEqual(["07:30", "20:00"]);
    const stored = await notificationScheduleRepository.findByUser("user-a");
    expect(stored).toHaveLength(2);
  });

  it("rejects mutations without a session instead of writing", async () => {
    const { result } = renderHook(() => useNotificationSchedules(null));

    const created = await result.current.create(input());

    expect(created.ok).toBe(false);
    expect(await getDatabase().notificationSchedules.count()).toBe(0);
  });

  it("surfaces validation errors raised by the repository", async () => {
    const { result } = renderHook(() => useNotificationSchedules("user-a"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const created = await result.current.create(input({ time: "25:00" }));

    expect(created.ok).toBe(false);
    if (!created.ok) expect(created.error).toMatch(/HH:MM/);
    expect(result.current.schedules).toEqual([]);
  });

  it("updates, toggles and deletes through the repository", async () => {
    const seed = await notificationScheduleRepository.create("user-a", input());
    const { result } = renderHook(() => useNotificationSchedules("user-a"));
    await waitFor(() => expect(result.current.schedules).toHaveLength(1));

    await act(async () => {
      const updated = await result.current.update(seed.id, { time: "09:00" });
      expect(updated.ok).toBe(true);
    });
    expect(result.current.schedules[0].time).toBe("09:00");

    await act(async () => {
      const toggled = await result.current.setEnabled(seed.id, false);
      expect(toggled.ok).toBe(true);
    });
    expect(result.current.schedules[0].enabled).toBe(false);
    expect(await notificationScheduleRepository.getEnabledSchedules("user-a")).toEqual([]);

    await act(async () => {
      const removed = await result.current.remove(seed.id);
      expect(removed.ok).toBe(true);
    });
    expect(result.current.schedules).toEqual([]);
    expect(await notificationScheduleRepository.findByUser("user-a")).toEqual([]);
  });

  it("reports a missing reminder instead of failing silently", async () => {
    const { result } = renderHook(() => useNotificationSchedules("user-a"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updated = await result.current.update("missing", { time: "09:00" });
    const toggled = await result.current.setEnabled("missing", false);
    const removed = await result.current.remove("missing");

    expect(updated.ok).toBe(false);
    expect(toggled.ok).toBe(false);
    expect(removed.ok).toBe(false);
  });

  it("never exposes another user's reminders", async () => {
    await notificationScheduleRepository.create("user-b", input({ label: "De Bob" }));

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string | null }) => useNotificationSchedules(userId),
      { initialProps: { userId: "user-b" as string | null } },
    );
    await waitFor(() => expect(result.current.schedules).toHaveLength(1));
    expect(result.current.schedules[0].label).toBe("De Bob");

    rerender({ userId: "user-a" });
    await waitFor(() => expect(result.current.schedules).toEqual([]));
  });
});
