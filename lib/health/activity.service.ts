import { activitySchema } from "../db/schema";
import { activityRepository } from "../db/repositories/activity.repository";
import type { Activity } from "../db/types";
import type {
  ActivityFilter,
  SaveActivityInput,
  ServiceResult,
  UpdateActivityInput,
} from "./types";
import { firstErrorMessage, parseLocalDateTime } from "./validation";

export async function createActivity(
  userId: string,
  input: SaveActivityInput
): Promise<ServiceResult<Activity>> {
  const startedAt = parseLocalDateTime(input.startedAtLocal);
  if (!startedAt) {
    return { ok: false, error: "Data e horário inválidos" };
  }

  const validation = activitySchema.safeParse({ ...input, startedAt });
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const record = await activityRepository.create({
    userId,
    type: validation.data.type,
    durationMinutes: validation.data.durationMinutes,
    startedAt: validation.data.startedAt,
    notes: validation.data.notes,
  });

  return { ok: true, data: record };
}

export async function updateActivity(
  userId: string,
  id: string,
  input: UpdateActivityInput
): Promise<ServiceResult<Activity>> {
  const existing = await activityRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  const data: Record<string, unknown> = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.durationMinutes !== undefined) {
    data.durationMinutes = input.durationMinutes;
  }
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.startedAtLocal !== undefined) {
    const startedAt = parseLocalDateTime(input.startedAtLocal);
    if (!startedAt) {
      return { ok: false, error: "Data e horário inválidos" };
    }
    data.startedAt = startedAt;
  }

  const validation = activitySchema.partial().safeParse(data);
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const updated = await activityRepository.update(id, validation.data);
  if (!updated) {
    return { ok: false, error: "Registro não encontrado" };
  }

  return { ok: true, data: updated };
}

export async function listActivities(
  userId: string,
  filter: ActivityFilter = {}
): Promise<ServiceResult<Activity[]>> {
  const records = await activityRepository.findByUser(userId, filter);
  return { ok: true, data: records };
}

export async function deleteActivity(
  userId: string,
  id: string
): Promise<ServiceResult<{ id: string }>> {
  const existing = await activityRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  await activityRepository.deleteById(id);
  return { ok: true, data: { id } };
}