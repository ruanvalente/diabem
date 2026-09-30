"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notificationScheduleRepository } from "@/lib/db/repositories/notification-schedule.repository";
import { getNotificationScheduler } from "@/lib/notifications/notification-scheduler.service";
import type {
  NotificationActionResult,
  NotificationSchedule,
  NotificationScheduleInput,
} from "@/lib/notifications/types";

type NotificationSchedulesState = {
  userId: string | null;
  schedules: NotificationSchedule[];
  error: string | null;
};

const EMPTY_STATE: NotificationSchedulesState = {
  userId: null,
  schedules: [],
  error: null,
};

const NO_SCHEDULES: NotificationSchedule[] = [];

const NO_SESSION_ERROR = "Sessão inválida.";
const NOT_FOUND_ERROR = "Lembrete não encontrado.";

function sortByTime(schedules: NotificationSchedule[]): NotificationSchedule[] {
  return [...schedules].sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Applies a local change to the loaded list. Records loaded for another session
 * are discarded so a mutation can never surface another user's reminders.
 */
function applySchedules(
  current: NotificationSchedulesState,
  userId: string,
  change: (schedules: NotificationSchedule[]) => NotificationSchedule[],
): NotificationSchedulesState {
  return {
    userId,
    error: null,
    schedules: change(current.userId === userId ? current.schedules : []),
  };
}

function messageFromCause(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

type ScheduleChange = (
  schedules: NotificationSchedule[],
) => NotificationSchedule[];

/** Commits a list change on behalf of the owner, discarding records of another session. */
type ApplyScheduleChange = (userId: string, change: ScheduleChange) => void;

type ScheduleMutation<TRecord> = {
  /**
   * Persists the change. Resolving `null` or `undefined` means the record no
   * longer exists, which the repository reports with `undefined`.
   */
  persist: () => Promise<TRecord | null | undefined>;
  /** Derives the new list from the persisted record. */
  commit: (record: TRecord) => ScheduleChange;
  /** Rearms the scheduler so the change is reflected in the next timer. */
  reschedule: (record: TRecord) => Promise<unknown>;
  /** Decides the copy shown when the mutation throws. */
  describeFailure: (cause: unknown) => string;
};

/**
 * Shared body of the mutations that return the stored record: persistence, list
 * commit and scheduler re-arm. Each mutation states how its failures are
 * described, because a repository validation error carries a message the user
 * should read while a storage error does not. Deletion is not covered here: it
 * has no record to return and only cancels the scheduler.
 */
async function mutateSchedule<TRecord>(
  userId: string,
  applyChange: ApplyScheduleChange,
  { persist, commit, reschedule, describeFailure }: ScheduleMutation<TRecord>,
): Promise<NotificationActionResult<TRecord>> {
  try {
    const record = await persist();
    if (record === null || record === undefined) {
      return { ok: false, error: NOT_FOUND_ERROR };
    }

    applyChange(userId, commit(record));
    await reschedule(record);
    return { ok: true, data: record };
  } catch (cause) {
    return { ok: false, error: describeFailure(cause) };
  }
}

export function useNotificationSchedules(userId: string | null) {
  const [loaded, setLoaded] = useState<NotificationSchedulesState>(EMPTY_STATE);
  const requestSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const requestId = ++requestSeqRef.current;
    try {
      const schedules = await notificationScheduleRepository.findByUser(userId);
      if (requestId !== requestSeqRef.current) return;
      setLoaded({ userId, schedules, error: null });
    } catch {
      if (requestId !== requestSeqRef.current) return;
      setLoaded({
        userId,
        schedules: [],
        error: "Não foi possível carregar os lembretes.",
      });
    }
  }, [userId]);

  useEffect(() => {
    // The state is written after the read resolves, not in the effect body; the
    // suppression matches the other read-on-mount hooks of the application.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void refresh();
  }, [refresh]);

  const isCurrent = loaded.userId === userId;
  const schedules = isCurrent ? loaded.schedules : NO_SCHEDULES;
  const error = isCurrent ? loaded.error : null;
  const isLoading = userId !== null && !isCurrent;

  const applyChange = useCallback<ApplyScheduleChange>(
    (ownerId, change) => {
      setLoaded((current) => applySchedules(current, ownerId, change));
    },
    [],
  );

  const create = useCallback(
    async (
      input: NotificationScheduleInput,
    ): Promise<NotificationActionResult<NotificationSchedule>> => {
      if (!userId) return { ok: false, error: NO_SESSION_ERROR };
      return mutateSchedule(userId, applyChange, {
        persist: () => notificationScheduleRepository.create(userId, input),
        commit: (record) => (schedules) => sortByTime([...schedules, record]),
        reschedule: (record) => getNotificationScheduler().schedule(record),
        describeFailure: (cause) =>
          messageFromCause(cause, "Não foi possível salvar o lembrete."),
      });
    },
    [userId, applyChange],
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<NotificationScheduleInput>,
    ): Promise<NotificationActionResult<NotificationSchedule>> => {
      if (!userId) return { ok: false, error: NO_SESSION_ERROR };
      return mutateSchedule(userId, applyChange, {
        persist: () => notificationScheduleRepository.update(userId, id, input),
        commit: (record) => (schedules) =>
          sortByTime(schedules.map((item) => (item.id === id ? record : item))),
        reschedule: (record) => getNotificationScheduler().schedule(record),
        describeFailure: (cause) =>
          messageFromCause(cause, "Não foi possível atualizar o lembrete."),
      });
    },
    [userId, applyChange],
  );

  const setEnabled = useCallback(
    async (
      id: string,
      enabled: boolean,
    ): Promise<NotificationActionResult<NotificationSchedule>> => {
      if (!userId) return { ok: false, error: NO_SESSION_ERROR };
      return mutateSchedule(userId, applyChange, {
        persist: () => notificationScheduleRepository.setEnabled(userId, id, enabled),
        commit: (record) => (schedules) =>
          schedules.map((item) => (item.id === id ? record : item)),
        reschedule: (record) => getNotificationScheduler().schedule(record),
        // Toggling never fails validation, so the failure is always about storage
        // and its technical message must not reach the user.
        describeFailure: () => "Não foi possível alterar o lembrete.",
      });
    },
    [userId, applyChange],
  );

  const remove = useCallback(
    async (id: string): Promise<NotificationActionResult<null>> => {
      if (!userId) return { ok: false, error: NO_SESSION_ERROR };
      try {
        const removed = await notificationScheduleRepository.deleteById(userId, id);
        if (!removed) return { ok: false, error: NOT_FOUND_ERROR };

        applyChange(userId, (schedules) =>
          schedules.filter((item) => item.id !== id),
        );
        await getNotificationScheduler().cancel(id);
        return { ok: true, data: null };
      } catch {
        return { ok: false, error: "Não foi possível excluir o lembrete." };
      }
    },
    [userId, applyChange],
  );

  return {
    schedules,
    isLoading,
    error,
    create,
    update,
    setEnabled,
    remove,
    refresh,
  };
}
