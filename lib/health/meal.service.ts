import { mealSchema } from "../db/schema";
import { mealRepository } from "../db/repositories/meal.repository";
import type { Meal } from "../db/types";
import type {
  MealFilter,
  SaveMealInput,
  ServiceResult,
  UpdateMealInput,
} from "./types";
import { firstErrorMessage, parseLocalDateTime } from "./validation";
import { recordAuditAsync } from "../audit";

export async function createMeal(
  userId: string,
  input: SaveMealInput
): Promise<ServiceResult<Meal>> {
  const consumedAt = parseLocalDateTime(input.consumedAtLocal);
  if (!consumedAt) {
    return { ok: false, error: "Data e horário inválidos" };
  }

  const validation = mealSchema.safeParse({ ...input, consumedAt });
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const now = new Date().toISOString();
  const record = await mealRepository.create({
    userId,
    type: validation.data.type,
    description: validation.data.description,
    consumedAt: validation.data.consumedAt,
    notes: validation.data.notes,
    provenance: {
      source: input.provenanceSource ?? "manual",
      recordedAt: now,
    },
  });

  recordAuditAsync("record.created", "meal", userId, record.id);

  return { ok: true, data: record };
}

export async function updateMeal(
  userId: string,
  id: string,
  input: UpdateMealInput
): Promise<ServiceResult<Meal>> {
  const existing = await mealRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  const data: Record<string, unknown> = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.description !== undefined) data.description = input.description;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.consumedAtLocal !== undefined) {
    const consumedAt = parseLocalDateTime(input.consumedAtLocal);
    if (!consumedAt) {
      return { ok: false, error: "Data e horário inválidos" };
    }
    data.consumedAt = consumedAt;
  }

  const validation = mealSchema.partial().safeParse(data);
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const updated = await mealRepository.update(id, validation.data);
  if (!updated) {
    return { ok: false, error: "Registro não encontrado" };
  }

  recordAuditAsync("record.updated", "meal", userId, id);

  return { ok: true, data: updated };
}

export async function listMeals(
  userId: string,
  filter: MealFilter = {}
): Promise<ServiceResult<Meal[]>> {
  const records = await mealRepository.findByUser(userId, filter);
  return { ok: true, data: records };
}

export async function deleteMeal(
  userId: string,
  id: string
): Promise<ServiceResult<{ id: string }>> {
  const existing = await mealRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  await mealRepository.deleteById(id);
  recordAuditAsync("record.deleted", "meal", userId, id);
  return { ok: true, data: { id } };
}