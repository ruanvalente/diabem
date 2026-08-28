"use client";

import { useCallback } from "react";
import type { GlucoseReading } from "@/lib/db/types";
import type {
  GlucoseReadingFilter,
  SaveGlucoseInput,
  ServiceResult,
  UpdateGlucoseInput,
} from "@/lib/health/types";
import {
  createGlucoseReading,
  deleteGlucoseReading,
  listGlucoseReadings,
  updateGlucoseReading,
} from "@/lib/health/glucose.service";
import { useEntityRecords } from "./use-entity-records";

const UNAUTHENTICATED: ServiceResult<GlucoseReading> = {
  ok: false,
  error: "Usuário não autenticado",
};

export function useGlucose(
  userId: string | null,
  defaultFilter?: GlucoseReadingFilter
) {
  const entity = useEntityRecords<GlucoseReading, GlucoseReadingFilter>(
    userId,
    listGlucoseReadings,
    defaultFilter
  );
  const { reload } = entity;

  const create = useCallback(
    async (input: SaveGlucoseInput): Promise<ServiceResult<GlucoseReading>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await createGlucoseReading(userId, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateGlucoseInput
    ): Promise<ServiceResult<GlucoseReading>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await updateGlucoseReading(userId, id, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const remove = useCallback(
    async (id: string): Promise<ServiceResult<{ id: string }>> => {
      if (!userId) return { ok: false, error: "Usuário não autenticado" };
      const result = await deleteGlucoseReading(userId, id);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  return { ...entity, create, update, remove };
}