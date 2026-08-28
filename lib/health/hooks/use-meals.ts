"use client";

import { useCallback } from "react";
import type { Meal } from "@/lib/db/types";
import type {
  MealFilter,
  SaveMealInput,
  ServiceResult,
  UpdateMealInput,
} from "@/lib/health/types";
import {
  createMeal,
  deleteMeal,
  listMeals,
  updateMeal,
} from "@/lib/health/meal.service";
import { useEntityRecords } from "./use-entity-records";

const UNAUTHENTICATED: ServiceResult<Meal> = {
  ok: false,
  error: "Usuário não autenticado",
};

export function useMeals(userId: string | null, defaultFilter?: MealFilter) {
  const entity = useEntityRecords<Meal, MealFilter>(
    userId,
    listMeals,
    defaultFilter
  );
  const { reload } = entity;

  const create = useCallback(
    async (input: SaveMealInput): Promise<ServiceResult<Meal>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await createMeal(userId, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const update = useCallback(
    async (
      id: string,
      input: UpdateMealInput
    ): Promise<ServiceResult<Meal>> => {
      if (!userId) return UNAUTHENTICATED;
      const result = await updateMeal(userId, id, input);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  const remove = useCallback(
    async (id: string): Promise<ServiceResult<{ id: string }>> => {
      if (!userId) return { ok: false, error: "Usuário não autenticado" };
      const result = await deleteMeal(userId, id);
      if (result.ok) await reload();
      return result;
    },
    [userId, reload]
  );

  return { ...entity, create, update, remove };
}