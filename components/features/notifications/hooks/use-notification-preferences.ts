"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationScheduleRepository } from "@/lib/db/repositories/notification-schedule.repository";
import { getNotificationScheduler } from "@/lib/notifications/notification-scheduler.service";
import type {
  NotificationActionResult,
  NotificationPreferences,
  NotificationPreferencesInput,
} from "@/lib/notifications/types";

type NotificationPreferencesState = {
  userId: string | null;
  preferences: NotificationPreferences | null;
  error: string | null;
};

const EMPTY_STATE: NotificationPreferencesState = {
  userId: null,
  preferences: null,
  error: null,
};

export function useNotificationPreferences(userId: string | null) {
  const [loaded, setLoaded] = useState<NotificationPreferencesState>(EMPTY_STATE);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    void notificationScheduleRepository
      .getPreferences(userId)
      .then((record) => {
        if (!cancelled) setLoaded({ userId, preferences: record, error: null });
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({
            userId,
            preferences: null,
            error: "Não foi possível carregar as preferências.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = useCallback(
    async (
      input: NotificationPreferencesInput,
    ): Promise<NotificationActionResult<NotificationPreferences>> => {
      if (!userId) return { ok: false, error: "Sessão inválida." };
      try {
        const preferences = await notificationScheduleRepository.updatePreferences(userId, input);
        setLoaded({ userId, preferences, error: null });
        await getNotificationScheduler().reload();
        return { ok: true, data: preferences };
      } catch (cause) {
        return {
          ok: false,
          error:
            cause instanceof Error ? cause.message : "Não foi possível salvar as preferências.",
        };
      }
    },
    [userId],
  );

  const isCurrent = loaded.userId === userId;

  return {
    preferences: isCurrent ? loaded.preferences : null,
    isLoading: userId !== null && !isCurrent,
    error: isCurrent ? loaded.error : null,
    save,
  };
}
