/**
 * Local notification scheduler.
 *
 * The scheduler never polls: it computes the next occurrence of every enabled
 * schedule, arms a single timer for the closest one and re-arms after firing or
 * when the caller signals that settings changed. Delivery is best-effort and
 * only happens while the application is running — no platform-independent
 * guarantee exists for a closed PWA, and the UI must state that limitation.
 */

import { notificationScheduleRepository } from "../db/repositories/notification-schedule.repository";
import { notificationService } from "../browser/services/notification.service";
import {
  buildNotificationBody,
  buildNotificationTag,
  buildNotificationTitle,
  resolveNotificationRoute,
} from "./notification-messages";
import {
  clampTimerDelay,
  getDelayUntil,
  getNextOccurrence,
  getOccurrenceKey,
  isWithinQuietHours,
  resolveTimeZone,
} from "./notification-recurrence";
import {
  NotificationRuleChain,
  OCCURRENCE_RECOVERY_WINDOW_MS,
  ScheduledNotificationRule,
  type NotificationRule,
} from "./notification-rule";
import type {
  NotificationPreferences,
  NotificationSchedule,
  NotificationSchedulerSnapshot,
} from "./types";

export type NotificationSchedulerRepository = Pick<
  typeof notificationScheduleRepository,
  "getEnabledSchedules" | "getPreferences" | "markOccurrence"
>;

export type NotificationSchedulerNotifier = Pick<
  typeof notificationService,
  "show" | "close" | "getPermission" | "closeAll"
>;

export type NotificationSchedulerDependencies = {
  repository: NotificationSchedulerRepository;
  notifications: NotificationSchedulerNotifier;
  rule?: NotificationRule;
  now?: () => Date;
  onError?: (error: unknown) => void;
};

export interface NotificationScheduler {
  schedule(schedule: NotificationSchedule): Promise<void>;
  cancel(scheduleId: string): Promise<void>;
  cancelAll(): Promise<void>;
  getScheduled(): Promise<NotificationSchedule[]>;
  start(userId: string): Promise<void>;
  stop(): Promise<void>;
  reload(): Promise<void>;
  getSnapshot(): NotificationSchedulerSnapshot;
}

export class LocalNotificationScheduler implements NotificationScheduler {
  private userId: string | null = null;
  private schedules: NotificationSchedule[] = [];
  private preferences: NotificationPreferences | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: NotificationSchedulerSnapshot = {
    status: "idle",
    activeScheduleIds: [],
    nextOccurrence: null,
    lastError: null,
  };
  private readonly rule: NotificationRule;
  private readonly now: () => Date;

  constructor(private readonly deps: NotificationSchedulerDependencies) {
    this.rule = deps.rule ?? new NotificationRuleChain([new ScheduledNotificationRule()]);
    this.now = deps.now ?? (() => new Date());
  }

  getSnapshot(): NotificationSchedulerSnapshot {
    return this.snapshot;
  }

  async start(userId: string): Promise<void> {
    this.clearTimer();
    this.userId = userId;
    await this.reload();
  }

  /**
   * Resets the session state synchronously, before awaiting the browser, so a
   * `start()` issued while `closeAll()` is still pending cannot be wiped by this
   * call. React runs effect cleanup without awaiting it, so a user switch or a
   * Strict Mode remount would otherwise leave the scheduler permanently idle.
   */
  async stop(): Promise<void> {
    this.clearTimer();
    this.userId = null;
    this.schedules = [];
    this.preferences = null;
    this.updateSnapshot({ status: "idle", activeScheduleIds: [], nextOccurrence: null, lastError: null });
    await this.deps.notifications.closeAll();
  }

  async reload(): Promise<void> {
    const userId = this.userId;
    if (!userId) return;
    try {
      const [schedules, preferences] = await Promise.all([
        this.deps.repository.getEnabledSchedules(userId),
        this.deps.repository.getPreferences(userId),
      ]);
      // The session may have changed while IndexedDB was busy. Discarding a
      // late read keeps one user's reminders from being armed in another's
      // session, which would leak reminder types and times through
      // notifications shown to the wrong person.
      if (this.userId !== userId) return;
      this.schedules = schedules;
      this.preferences = preferences;
      this.rearm();
    } catch (error) {
      if (this.userId !== userId) return;
      this.deps.onError?.(error);
      this.updateSnapshot({ ...this.snapshot, status: "error", lastError: "Não foi possível carregar os lembretes." });
    }
  }

  async schedule(schedule: NotificationSchedule): Promise<void> {
    this.schedules = [
      ...this.schedules.filter((item) => item.id !== schedule.id),
      ...(schedule.enabled ? [schedule] : []),
    ];
    this.rearm();
  }

  async cancel(scheduleId: string): Promise<void> {
    this.schedules = this.schedules.filter((item) => item.id !== scheduleId);
    await this.deps.notifications.close(buildNotificationTag(scheduleId));
    this.rearm();
  }

  async cancelAll(): Promise<void> {
    const tags = this.schedules.map((item) => buildNotificationTag(item.id));
    this.schedules = [];
    for (const tag of tags) {
      await this.deps.notifications.close(tag);
    }
    this.rearm();
  }

  async getScheduled(): Promise<NotificationSchedule[]> {
    return [...this.schedules];
  }

  /**
   * Quiet hours are expressed in the schedule's own timezone, so a schedule
   * whose time always falls inside the silent window is intentionally never
   * armed instead of firing during the silence.
   */
  private candidateOccurrences(
    now: Date,
  ): { schedule: NotificationSchedule; at: Date }[] {
    if (this.preferences && !this.preferences.enabled) return [];
    const candidates: { schedule: NotificationSchedule; at: Date }[] = [];
    for (const schedule of this.schedules) {
      const at = getNextOccurrence(schedule, now);
      if (!at) continue;
      if (
        this.preferences &&
        isWithinQuietHours(at, this.preferences.quietHours, resolveTimeZone(schedule.timeZone))
      ) {
        continue;
      }
      candidates.push({ schedule, at });
    }
    return candidates;
  }

  private nextOccurrence(
    now: Date,
  ): { schedule: NotificationSchedule; at: Date } | null {
    const candidates = this.candidateOccurrences(now);
    if (candidates.length === 0) return null;
    return candidates.reduce((closest, candidate) =>
      candidate.at.getTime() < closest.at.getTime() ? candidate : closest,
    );
  }

  private rearm(): void {
    this.clearTimer();
    if (!this.userId || this.schedules.length === 0) {
      this.updateToIdleSnapshot();
      return;
    }

    const now = this.now();
    const next = this.nextOccurrence(now);
    if (!next) {
      this.updateToIdleSnapshot();
      return;
    }

    const delay = clampTimerDelay(getDelayUntil(next.at, now));
    this.timer = setTimeout(() => {
      void this.tick();
    }, delay);

    this.updateSnapshot({
      status: "running",
      activeScheduleIds: this.schedules.map((item) => item.id),
      nextOccurrence: { scheduleId: next.schedule.id, at: next.at.toISOString() },
      lastError: this.snapshot.lastError,
    });
  }

  private updateToIdleSnapshot(): void {
    this.updateSnapshot({
      status: this.schedules.length === 0 ? "idle" : "running",
      activeScheduleIds: this.schedules.map((item) => item.id),
      nextOccurrence: null,
      lastError: this.snapshot.lastError,
    });
  }

  private updateSnapshot(snapshot: NotificationSchedulerSnapshot): void {
    this.snapshot = snapshot;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    this.timer = null;
    const now = this.now();

    for (const { schedule, at } of this.candidateOccurrences(
      new Date(now.getTime() - OCCURRENCE_RECOVERY_WINDOW_MS),
    )) {
      if (at.getTime() > now.getTime()) continue;
      if (now.getTime() - at.getTime() > OCCURRENCE_RECOVERY_WINDOW_MS) continue;
      // A failing delivery must never skip the rearm below, otherwise the
      // scheduler stays dead for the rest of the session.
      try {
        await this.deliver(schedule, at, now);
      } catch (error) {
        this.deps.onError?.(error);
        this.updateSnapshot({
          ...this.snapshot,
          lastError: "Não foi possível entregar o lembrete.",
        });
      }
    }

    this.rearm();
  }

  private async deliver(
    schedule: NotificationSchedule,
    occurrence: Date,
    now: Date,
  ): Promise<void> {
    if (!this.userId) return;
    if (this.deps.notifications.getPermission() !== "granted") return;

    const occurrenceKey = getOccurrenceKey(schedule.id, occurrence);
    if (schedule.lastOccurrenceKey === occurrenceKey) return;

    const shouldNotify = await this.rule.shouldNotify({
      now,
      occurrence,
      schedule,
      userId: this.userId,
    });
    if (!shouldNotify) return;

    const result = await this.deps.notifications.show({
      title: buildNotificationTitle(schedule),
      body: buildNotificationBody(schedule),
      tag: buildNotificationTag(schedule.id),
      url: resolveNotificationRoute(schedule),
      icon: "/icons/icon-192.png",
    });

    await this.deps.repository.markOccurrence(this.userId, schedule.id, occurrenceKey);
    this.schedules = this.schedules.map((item) =>
      item.id === schedule.id ? { ...item, lastOccurrenceKey: occurrenceKey } : item,
    );

    this.updateSnapshot({
      ...this.snapshot,
      lastError: result.ok ? null : "A notificação não pôde ser exibida.",
    });
  }
}

let schedulerInstance: LocalNotificationScheduler | null = null;

export function getNotificationScheduler(): LocalNotificationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new LocalNotificationScheduler({
      repository: notificationScheduleRepository,
      notifications: notificationService,
    });
  }
  return schedulerInstance;
}
