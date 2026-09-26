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

function sortByTime(schedules: NotificationSchedule[]): NotificationSchedule[] {
  return [...schedules].sort((a, b) => a.time.localeCompare(b.time));
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
      setLoaded({ userId, schedules: [], error: "Não foi possível carregar os lembretes." });
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void refresh();
  }, [refresh]);

  const isCurrent = loaded.userId === userId;
  const schedules = isCurrent ? loaded.schedules : EMPTY_STATE.schedules;
  const error = isCurrent ? loaded.error : null;
  const isLoading = userId !== null && !isCurrent;

  const create = useCallback(
    async (
      input: NotificationScheduleInput,
    ): Promise<NotificationActionResult<NotificationSchedule>> => {
      if (!userId) return { ok: false, error: "Sessão inválida." };
      try {
        const record = await notificationScheduleRepository.create(userId, input);
        setLoaded((current) => ({
          userId,
          error: null,
          schedules: sortByTime([
            ...(current.userId === userId ? current.schedules : []),
            record,
          ]),
        }));
        await getNotificationScheduler().schedule(record);
        return { ok: true, data: record };
      } catch (cause) {
        return {
          ok: false,
          error: cause instanceof Error ? cause.message : "Não foi possível salvar o lembrete.",
        };
      }
    },
    [userId],
  );

  const update = useCallback(
    async (
      id: string,
      input: Partial<NotificationScheduleInput>,
    ): Promise<NotificationActionResult<NotificationSchedule>> => {
      if (!userId) return { ok: false, error: "Sessão inválida." };
      try {
        const record = await notificationScheduleRepository.update(userId, id, input);
        if (!record) return { ok: false, error: "Lembrete não encontrado." };
        setLoaded((current) => ({
          userId,
          error: null,
          schedules: sortByTime(
            (current.userId === userId ? current.schedules : []).map((item) =>
              item.id === id ? record : item,
            ),
          ),
        }));
        await getNotificationScheduler().schedule(record);
        return { ok: true, data: record };
      } catch (cause) {
        return {
          ok: false,
          error: cause instanceof Error ? cause.message : "Não foi possível atualizar o lembrete.",
        };
      }
    },
    [userId],
  );

  const setEnabled = useCallback(
    async (id: string, enabled: boolean): Promise<NotificationActionResult<NotificationSchedule>> => {
      if (!userId) return { ok: false, error: "Sessão inválida." };
      try {
        const record = await notificationScheduleRepository.setEnabled(userId, id, enabled);
        if (!record) return { ok: false, error: "Lembrete não encontrado." };
        setLoaded((current) => ({
          userId,
          error: null,
          schedules: (current.userId === userId ? current.schedules : []).map((item) =>
            item.id === id ? record : item,
          ),
        }));
        await getNotificationScheduler().schedule(record);
        return { ok: true, data: record };
      } catch {
        return { ok: false, error: "Não foi possível alterar o lembrete." };
      }
    },
    [userId],
  );

  const remove = useCallback(
    async (id: string): Promise<NotificationActionResult<null>> => {
      if (!userId) return { ok: false, error: "Sessão inválida." };
      try {
        const removed = await notificationScheduleRepository.deleteById(userId, id);
        if (!removed) return { ok: false, error: "Lembrete não encontrado." };
        setLoaded((current) => ({
          userId,
          error: null,
          schedules: (current.userId === userId ? current.schedules : []).filter(
            (item) => item.id !== id,
          ),
        }));
        await getNotificationScheduler().cancel(id);
        return { ok: true, data: null };
      } catch {
        return { ok: false, error: "Não foi possível excluir o lembrete." };
      }
    },
    [userId],
  );

  return { schedules, isLoading, error, create, update, setEnabled, remove, refresh };
}
