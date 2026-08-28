"use client";

import { useCallback } from "react";
import type { Activity } from "@/lib/db/types";
import type {
  ActivityFilter,
  SaveActivityInput,
  ServiceResult,
  UpdateActivityInput,
} from "@/lib/health/types";
import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
} from "@/lib/health/activity.service";
import { useEntityRecords } from "./use-entity-records";

const UNAUTHENTICATED: ServiceResult<Activity> = {
  ok: false,
  error: "Usuário não autenticado",
};

export function useActivities(
  userId: string | null,
  defaultFilter?: ActivityFilter
) {
  const entity = useEntityRecords<Activity, ActivityFilter>(
    userId,
    listActivities,
    defaultFilter
  );
  const { reload } = entity;

  const create = useCallback(
    async (input: SaveActivityInput): Promise<ServiceResult<Activity>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await createActivity(userId, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateActivityInput
    ): Promise<ServiceResult<Activity>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await updateActivity(userId, id, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const remove = useCallback(
    async (id: string): Promise<ServiceResult<{ id: string }>> => {
      if (!userId) return { ok: false, error: "Usuário não autenticado" };
      const result = await deleteActivity(userId, id);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  return { ...entity, create, update, remove };
}