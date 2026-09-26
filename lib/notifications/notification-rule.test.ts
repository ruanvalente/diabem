import { describe, expect, it, vi } from "vitest";
import {
  NotificationRuleChain,
  ScheduledNotificationRule,
  type NotificationContext,
  type NotificationRule,
} from "./notification-rule";
import { NOTIFICATION_WEEKDAY_KEYS, type NotificationSchedule } from "./types";

function createSchedule(overrides: Partial<NotificationSchedule> = {}): NotificationSchedule {
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

function createContext(
  isoDate: string,
  scheduleOverrides: Partial<NotificationSchedule> = {},
  latenessMs = 0,
): NotificationContext {
  const now = new Date(isoDate);
  return {
    now,
    occurrence: new Date(now.getTime() - latenessMs),
    schedule: createSchedule(scheduleOverrides),
    userId: "user-1",
  };
}

describe("ScheduledNotificationRule", () => {
  const rule = new ScheduledNotificationRule();

  it("returns true when the local time matches", async () => {
    await expect(
      rule.shouldNotify(createContext("2026-01-05T08:00:00.000Z")),
    ).resolves.toBe(true);
  });

  it("returns false when the occurrence is not at the scheduled time", async () => {
    await expect(
      rule.shouldNotify({
        now: new Date("2026-01-05T08:00:00.000Z"),
        occurrence: new Date("2026-01-05T08:03:00.000Z"),
        schedule: createSchedule(),
        userId: "user-1",
      }),
    ).resolves.toBe(false);
  });

  it("delivers a reminder delayed inside the recovery window", async () => {
    // A sleeping laptop or a throttled background tab delays the timer. The
    // scheduler accepts these occurrences, so the rule must not drop them.
    await expect(
      rule.shouldNotify(createContext("2026-01-05T08:14:00.000Z", {}, 14 * 60 * 1000)),
    ).resolves.toBe(true);
  });

  it("drops a reminder delayed beyond the recovery window", async () => {
    await expect(
      rule.shouldNotify(createContext("2026-01-05T08:16:00.000Z", {}, 16 * 60 * 1000)),
    ).resolves.toBe(false);
  });

  it("returns false when the occurrence weekday is not allowed", async () => {
    await expect(
      rule.shouldNotify({
        now: new Date("2026-01-06T08:00:00.000Z"),
        occurrence: new Date("2026-01-05T08:00:00.000Z"),
        schedule: createSchedule({ daysOfWeek: ["tuesday"] }),
        userId: "user-1",
      }),
    ).resolves.toBe(false);
  });

  it("returns false when the schedule is disabled", async () => {
    await expect(
      rule.shouldNotify(
        createContext("2026-01-05T08:00:00.000Z", { enabled: false }),
      ),
    ).resolves.toBe(false);
  });

});

describe("NotificationRuleChain", () => {
  it("returns true when every rule passes", async () => {
    const firstRule: NotificationRule = {
      shouldNotify: vi.fn<NotificationRule["shouldNotify"]>().mockResolvedValue(true),
    };
    const secondRule: NotificationRule = {
      shouldNotify: vi.fn<NotificationRule["shouldNotify"]>().mockResolvedValue(true),
    };
    const chain = new NotificationRuleChain([firstRule, secondRule]);

    await expect(chain.shouldNotify(createContext("2026-01-05T08:00:00.000Z"))).resolves.toBe(
      true,
    );
    expect(firstRule.shouldNotify).toHaveBeenCalledTimes(1);
    expect(secondRule.shouldNotify).toHaveBeenCalledTimes(1);
  });

  it("returns false when a later rule fails", async () => {
    const firstRule: NotificationRule = {
      shouldNotify: vi.fn<NotificationRule["shouldNotify"]>().mockResolvedValue(true),
    };
    const secondRule: NotificationRule = {
      shouldNotify: vi.fn<NotificationRule["shouldNotify"]>().mockResolvedValue(false),
    };
    const chain = new NotificationRuleChain([firstRule, secondRule]);

    await expect(chain.shouldNotify(createContext("2026-01-05T08:00:00.000Z"))).resolves.toBe(
      false,
    );
  });

  it("stops the chain at the first failing rule", async () => {
    const firstRule: NotificationRule = {
      shouldNotify: vi.fn<NotificationRule["shouldNotify"]>().mockResolvedValue(false),
    };
    const secondRule: NotificationRule = {
      shouldNotify: vi.fn<NotificationRule["shouldNotify"]>().mockResolvedValue(true),
    };
    const chain = new NotificationRuleChain([firstRule, secondRule]);

    await expect(chain.shouldNotify(createContext("2026-01-05T08:00:00.000Z"))).resolves.toBe(
      false,
    );
    expect(firstRule.shouldNotify).toHaveBeenCalledTimes(1);
    expect(secondRule.shouldNotify).not.toHaveBeenCalled();
  });
});
