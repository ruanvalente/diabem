import { getWeekdayKey, resolveTimeZone } from "./notification-recurrence";
import type { NotificationSchedule } from "./types";

/**
 * How late a delivery may be and still be delivered.
 *
 * A suspended laptop or a throttled background tab delays the timer, so an
 * occurrence that already passed must still be delivered when the app wakes up.
 * This is the single source of truth for that window: the scheduler uses it to
 * decide which occurrences are still worth delivering, and `ScheduledNotificationRule`
 * uses it to confirm the delivery is inside it. Keeping two independent windows
 * previously meant a reminder delayed by 3 to 15 minutes was accepted by the
 * scheduler and then silently dropped by the rule.
 */
export const OCCURRENCE_RECOVERY_WINDOW_MS = 15 * 60 * 1000;

/** Clock skew tolerated when matching an occurrence against a schedule time. */
const MATCH_TOLERANCE_MINUTES = 1;

export type NotificationContext = {
  now: Date;
  /**
   * The exact occurrence being delivered. The rule validates this instant rather
   * than re-deriving an intended time from `now`, so a late delivery is judged
   * by how late it is instead of being rejected for missing its minute.
   */
  occurrence: Date;
  schedule: NotificationSchedule;
  userId: string;
};

export interface NotificationRule {
  shouldNotify(context: NotificationContext): Promise<boolean>;
}

function minutesSinceMidnight(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return (read("hour") % 24) * 60 + read("minute");
}

export class ScheduledNotificationRule implements NotificationRule {
  shouldNotify({ now, occurrence, schedule }: NotificationContext): Promise<boolean> {
    if (!schedule.enabled) return Promise.resolve(false);
    if (schedule.daysOfWeek.length === 0) return Promise.resolve(false);

    const timeZone = resolveTimeZone(schedule.timeZone);
    if (!schedule.daysOfWeek.includes(getWeekdayKey(occurrence, timeZone))) {
      return Promise.resolve(false);
    }

    const [hour, minute] = schedule.time.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return Promise.resolve(false);

    const target = hour * 60 + minute;
    const occurrenceMinutes = minutesSinceMidnight(occurrence, timeZone);
    if (Math.abs(occurrenceMinutes - target) > MATCH_TOLERANCE_MINUTES) {
      return Promise.resolve(false);
    }

    // Small negative skew is tolerated: the timer can fire a hair before the
    // computed instant. Beyond the recovery window the reminder is stale and
    // firing it would surface a notification the user never asked for.
    const lateness = now.getTime() - occurrence.getTime();
    if (lateness > OCCURRENCE_RECOVERY_WINDOW_MS) return Promise.resolve(false);

    return Promise.resolve(true);
  }
}

export class NotificationRuleChain implements NotificationRule {
  constructor(private readonly rules: readonly NotificationRule[]) {}

  async shouldNotify(context: NotificationContext): Promise<boolean> {
    for (const rule of this.rules) {
      if (!(await rule.shouldNotify(context))) return false;
    }
    return true;
  }
}
