"use client";

import { useCallback } from "react";
import type { Medication } from "@/lib/db/types";
import type {
  MedicationFilter,
  SaveMedicationInput,
  ServiceResult,
  UpdateMedicationInput,
} from "@/lib/health/types";
import {
  createMedication,
  deleteMedication,
  listMedications,
  updateMedication,
} from "@/lib/health/medication.service";
import { useEntityRecords } from "./use-entity-records";

const UNAUTHENTICATED_ERROR = "Usuário não autenticado";

/** Error result returned when an operation is attempted without a userId. */
function unauthenticated<T>(): ServiceResult<T> {
  return { ok: false, error: UNAUTHENTICATED_ERROR };
}

export function useMedications(
  userId: string | null,
  defaultFilter?: MedicationFilter
) {
  const entity = useEntityRecords<Medication, MedicationFilter>(
    userId,
    listMedications,
    defaultFilter
  );
  const { reload } = entity;

  const create = useCallback(
    async (input: SaveMedicationInput): Promise<ServiceResult<Medication>> => {
      if (!userId) return unauthenticated<Medication>();
      const result = await createMedication(userId, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateMedicationInput
    ): Promise<ServiceResult<Medication>> => {
      if (!userId) return unauthenticated<Medication>();
      const result = await updateMedication(userId, id, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const remove = useCallback(
    async (id: string): Promise<ServiceResult<{ id: string }>> => {
      if (!userId) return unauthenticated<{ id: string }>();
      const result = await deleteMedication(userId, id);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  return { ...entity, create, update, remove };
}