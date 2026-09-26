import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationPermissionState } from "../browser/capabilities/notifications";
import type {
  NotificationPayload,
  NotifyResult,
} from "../browser/services/notification.types";
import {
  LocalNotificationScheduler,
  type NotificationSchedulerNotifier,
  type NotificationSchedulerRepository,
} from "./notification-scheduler.service";
import type { NotificationRule } from "./notification-rule";
import {
  NOTIFICATION_WEEKDAY_KEYS,
  type NotificationPreferences,
  type NotificationSchedule,
} from "./types";

const getEnabledSchedules = vi.fn<
  (userId: string) => Promise<NotificationSchedule[]>
>();
const getPreferences = vi.fn<
  (userId: string) => Promise<NotificationPreferences>
>();
const markOccurrence = vi.fn<
  (userId: string, scheduleId: string, occurrenceKey: string) => Promise<void>
>();
const show = vi.fn<(payload: NotificationPayload) => Promise<NotifyResult>>();
const close = vi.fn<(tag: string) => Promise<number>>();
const closeAll = vi.fn<() => Promise<number>>();
const getPermission = vi.fn<() => NotificationPermissionState>();
const shouldNotify = vi.fn<NotificationRule["shouldNotify"]>();

const repository: NotificationSchedulerRepository = {
  getEnabledSchedules,
  getPreferences,
  markOccurrence,
};

const notifications: NotificationSchedulerNotifier = {
  show,
  close,
  closeAll,
  getPermission,
};

const rule: NotificationRule = { shouldNotify };

function createSchedule(
  overrides: Partial<NotificationSchedule> = {},
): NotificationSchedule {
  return {
    id: "schedule-1",
    userId: "user-1",
    label: "",
    period: "morning",
    time: "08:00",
    enabled: true,
    daysOfWeek: [...NOTIFICATION_WEEKDAY_KEYS],
    reminderTypes: ["glucose"],
    timeZone: "UTC",
    lastOccurrenceKey: null,
    createdAt: "2026-01-05T07:00:00.000Z",
    updatedAt: "2026-01-05T07:00:00.000Z",
    ...overrides,
  };
}

function createPreferences(
  overrides: Partial<NotificationPreferences> = {},
): NotificationPreferences {
  return {
    userId: "user-1",
    enabled: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
    },
    timeZone: "UTC",
    createdAt: "2026-01-05T07:00:00.000Z",
    updatedAt: "2026-01-05T07:00:00.000Z",
    ...overrides,
  };
}

let current: Date;
let scheduler: LocalNotificationScheduler;

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
}

async function fireNextTimer(at: Date): Promise<void> {
  const nextOccurrence = scheduler.getSnapshot().nextOccurrence;
  if (!nextOccurrence) throw new Error("Não há próxima ocorrência armada.");

  const delay = new Date(nextOccurrence.at).getTime() - Date.now();
  current = at;
  await vi.advanceTimersByTimeAsync(delay);
  await flushMicrotasks();
}

beforeEach(() => {
  vi.useFakeTimers();
  current = new Date("2026-01-05T07:00:00.000Z");
  vi.setSystemTime(current);

  vi.clearAllMocks();
  getEnabledSchedules.mockResolvedValue([]);
  getPreferences.mockResolvedValue(createPreferences());
  markOccurrence.mockResolvedValue(undefined);
  show.mockResolvedValue({ ok: true, transport: "constructor" });
  close.mockResolvedValue(0);
  closeAll.mockResolvedValue(0);
  getPermission.mockReturnValue("granted");
  shouldNotify.mockResolvedValue(true);

  scheduler = new LocalNotificationScheduler({
    repository,
    notifications,
    rule,
    now: () => current,
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LocalNotificationScheduler", () => {
  it("loads schedules and preferences and arms only the nearest occurrence", async () => {
    getEnabledSchedules.mockResolvedValue([
      createSchedule(),
      createSchedule({ id: "schedule-2", time: "07:30" }),
    ]);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    await scheduler.start("user-1");

    expect(getEnabledSchedules).toHaveBeenCalledWith("user-1");
    expect(getPreferences).toHaveBeenCalledWith("user-1");
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(scheduler.getSnapshot()).toMatchObject({
      status: "running",
      activeScheduleIds: ["schedule-1", "schedule-2"],
      nextOccurrence: {
        scheduleId: "schedule-2",
        at: "2026-01-05T07:30:00.000Z",
      },
    });
  });

  it("displays and records an occurrence when the timer fires", async () => {
    getEnabledSchedules.mockResolvedValue([createSchedule()]);
    await scheduler.start("user-1");

    await fireNextTimer(new Date("2026-01-05T08:00:00.000Z"));

    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledWith({
      title: "Manhã",
      body: "Bom dia! Reserve um momento para registrar seus dados de hoje. Lembre-se de registrar sua medição.",
      tag: "diabem-reminder-schedule-1",
      url: "/glucose",
      icon: "/icons/icon-192.png",
    });
    expect(markOccurrence).toHaveBeenCalledWith(
      "user-1",
      "schedule-1",
      "schedule-1@1767600000000",
    );
  });

  it("does not deliver an already recorded occurrence again", async () => {
    getEnabledSchedules.mockResolvedValue([
      createSchedule({
        lastOccurrenceKey: "schedule-1@1767600000000",
      }),
    ]);
    await scheduler.start("user-1");

    await fireNextTimer(new Date("2026-01-05T08:00:00.000Z"));

    expect(show).not.toHaveBeenCalled();
    expect(markOccurrence).not.toHaveBeenCalled();
  });

  it("does not arm a timer when there are no enabled schedules", async () => {
    getEnabledSchedules.mockResolvedValue([]);

    await scheduler.start("user-1");

    expect(vi.getTimerCount()).toBe(0);
    expect(scheduler.getSnapshot()).toMatchObject({
      status: "idle",
      activeScheduleIds: [],
      nextOccurrence: null,
    });
  });

  it("does not arm a timer when the global preferences are disabled", async () => {
    getEnabledSchedules.mockResolvedValue([createSchedule()]);
    getPreferences.mockResolvedValue(createPreferences({ enabled: false }));

    await scheduler.start("user-1");

    expect(vi.getTimerCount()).toBe(0);
    expect(scheduler.getSnapshot().nextOccurrence).toBeNull();
    expect(show).not.toHaveBeenCalled();
  });

  it("skips an occurrence inside quiet hours and arms the next allowed one", async () => {
    getEnabledSchedules.mockResolvedValue([
      createSchedule({ time: "23:00" }),
      createSchedule({
        id: "schedule-2",
        time: "08:00",
        daysOfWeek: ["tuesday"],
      }),
    ]);
    getPreferences.mockResolvedValue(
      createPreferences({
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "07:00",
        },
      }),
    );
    current = new Date("2026-01-05T22:30:00.000Z");
    vi.setSystemTime(current);

    await scheduler.start("user-1");

    expect(scheduler.getSnapshot().nextOccurrence).toEqual({
      scheduleId: "schedule-2",
      at: "2026-01-06T08:00:00.000Z",
    });
    expect(vi.getTimerCount()).toBe(1);
  });

  it("does not arm a timer when the schedule time is always inside quiet hours", async () => {
    getEnabledSchedules.mockResolvedValue([createSchedule({ time: "23:00" })]);
    getPreferences.mockResolvedValue(
      createPreferences({
        quietHours: {
          enabled: true,
          start: "22:00",
          end: "07:00",
        },
      }),
    );
    current = new Date("2026-01-05T12:00:00.000Z");
    vi.setSystemTime(current);

    await scheduler.start("user-1");

    expect(scheduler.getSnapshot().nextOccurrence).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels one schedule, closes its tag and rearms the rest", async () => {
    getEnabledSchedules.mockResolvedValue([
      createSchedule(),
      createSchedule({ id: "schedule-2", daysOfWeek: ["tuesday"] }),
    ]);
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    await scheduler.start("user-1");

    await scheduler.cancel("schedule-1");

    expect(close).toHaveBeenCalledWith("diabem-reminder-schedule-1");
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(scheduler.getSnapshot()).toMatchObject({
      status: "running",
      activeScheduleIds: ["schedule-2"],
      nextOccurrence: {
        scheduleId: "schedule-2",
        at: "2026-01-06T08:00:00.000Z",
      },
    });
  });

  it("cancels every schedule and closes each tag", async () => {
    getEnabledSchedules.mockResolvedValue([
      createSchedule(),
      createSchedule({ id: "schedule-2", time: "09:00" }),
    ]);
    await scheduler.start("user-1");

    await scheduler.cancelAll();

    expect(close).toHaveBeenNthCalledWith(
      1,
      "diabem-reminder-schedule-1",
    );
    expect(close).toHaveBeenNthCalledWith(2, "diabem-reminder-schedule-2");
    await expect(scheduler.getScheduled()).resolves.toEqual([]);
    expect(scheduler.getSnapshot()).toMatchObject({
      status: "idle",
      activeScheduleIds: [],
      nextOccurrence: null,
    });
  });

  it("does not display the occurrence without granted permission", async () => {
    getEnabledSchedules.mockResolvedValue([createSchedule()]);
    getPermission.mockReturnValue("denied");
    await scheduler.start("user-1");

    await fireNextTimer(new Date("2026-01-05T08:00:00.000Z"));

    expect(show).not.toHaveBeenCalled();
    expect(markOccurrence).not.toHaveBeenCalled();
  });

  it("does not deliver an occurrence delayed by more than 15 minutes", async () => {
    current = new Date("2026-01-05T07:46:00.000Z");
    vi.setSystemTime(current);
    getEnabledSchedules.mockResolvedValue([createSchedule()]);
    await scheduler.start("user-1");

    await fireNextTimer(new Date("2026-01-05T08:16:00.000Z"));

    expect(show).not.toHaveBeenCalled();
    expect(markOccurrence).not.toHaveBeenCalled();
  });

  it("removes an armed schedule when schedule receives enabled false", async () => {
    const schedule = createSchedule();
    getEnabledSchedules.mockResolvedValue([schedule]);
    await scheduler.start("user-1");

    await scheduler.schedule({ ...schedule, enabled: false });

    await expect(scheduler.getScheduled()).resolves.toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    expect(scheduler.getSnapshot()).toMatchObject({
      status: "idle",
      activeScheduleIds: [],
      nextOccurrence: null,
    });
  });

  it("keeps the new session armed when start races a pending stop", async () => {
    getEnabledSchedules.mockResolvedValue([createSchedule()]);

    // React runs effect cleanup without awaiting it, so stop() is still pending
    // on the browser when the next effect calls start().
    let releaseCloseAll: () => void = () => {};
    closeAll.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          releaseCloseAll = () => resolve(0);
        }),
    );

    await scheduler.start("user-1");
    const pendingStop = scheduler.stop();
    const pendingStart = scheduler.start("user-1");
    await flushMicrotasks();

    releaseCloseAll();
    await pendingStop;
    await pendingStart;
    await flushMicrotasks();

    await expect(scheduler.getScheduled()).resolves.toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
    expect(scheduler.getSnapshot()).toMatchObject({ status: "running" });
  });

  it("discards a slow read that resolves after the user changed", async () => {
    // A backgrounded tab deprioritises IndexedDB, so user A's read can still be
    // in flight when A logs out and B logs in. Resolving A's read last must not
    // put A's reminders into B's session.
    const scheduleA = createSchedule({ id: "schedule-a", userId: "user-a" });
    const scheduleB = createSchedule({ id: "schedule-b", userId: "user-b" });

    let releaseA: () => void = () => {};
    getEnabledSchedules.mockImplementation((userId: string) => {
      if (userId === "user-a") {
        return new Promise((resolve) => {
          releaseA = () => resolve([scheduleA]);
        });
      }
      return Promise.resolve([scheduleB]);
    });

    const pendingA = scheduler.start("user-a");
    await flushMicrotasks();

    await scheduler.start("user-b");
    await expect(scheduler.getScheduled()).resolves.toEqual([scheduleB]);

    releaseA();
    await pendingA;
    await flushMicrotasks();

    await expect(scheduler.getScheduled()).resolves.toEqual([scheduleB]);
    expect(scheduler.getSnapshot()).toMatchObject({ status: "running" });
    expect(scheduler.getSnapshot().activeScheduleIds).toEqual(["schedule-b"]);
  });

  it("rearms the timer after a delivery failure", async () => {
    getEnabledSchedules.mockResolvedValue([createSchedule()]);
    markOccurrence.mockRejectedValue(new Error("IndexedDB indisponível"));
    await scheduler.start("user-1");

    await fireNextTimer(new Date("2026-01-05T08:00:00.000Z"));

    // The notification was shown, the write failed: the next occurrence must
    // still be armed, otherwise every later reminder is silently lost.
    expect(show).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    expect(scheduler.getSnapshot().nextOccurrence).not.toBeNull();
    expect(scheduler.getSnapshot().lastError).toBe(
      "Não foi possível entregar o lembrete.",
    );
  });
});
