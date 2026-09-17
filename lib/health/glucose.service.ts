import { glucoseReadingSchema } from "../db/schema";
import { glucoseRepository } from "../db/repositories/glucose.repository";
import type { GlucoseReading } from "../db/types";
import type {
  GlucoseReadingFilter,
  SaveGlucoseInput,
  ServiceResult,
  UpdateGlucoseInput,
} from "./types";
import { firstErrorMessage, parseLocalDateTime } from "./validation";
import { recordAuditAsync } from "../audit";

export async function createGlucoseReading(
  userId: string,
  input: SaveGlucoseInput
): Promise<ServiceResult<GlucoseReading>> {
  const measuredAt = parseLocalDateTime(input.measuredAtLocal);
  if (!measuredAt) {
    return { ok: false, error: "Data e horário inválidos" };
  }

  const validation = glucoseReadingSchema.safeParse({
    ...input,
    measuredAt,
  });
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const now = new Date().toISOString();
  const record = await glucoseRepository.create({
    userId,
    value: validation.data.value,
    unit: validation.data.unit,
    context: validation.data.context,
    measuredAt: validation.data.measuredAt,
    notes: validation.data.notes,
    provenance: {
      source: input.provenanceSource ?? "manual",
      recordedAt: now,
    },
  });

  recordAuditAsync("record.created", "glucose", userId, record.id);

  return { ok: true, data: record };
}

export async function updateGlucoseReading(
  userId: string,
  id: string,
  input: UpdateGlucoseInput
): Promise<ServiceResult<GlucoseReading>> {
  const existing = await glucoseRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  const data: Record<string, unknown> = {};
  if (input.value !== undefined) data.value = input.value;
  if (input.context !== undefined) data.context = input.context;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.measuredAtLocal !== undefined) {
    const measuredAt = parseLocalDateTime(input.measuredAtLocal);
    if (!measuredAt) {
      return { ok: false, error: "Data e horário inválidos" };
    }
    data.measuredAt = measuredAt;
  }

  const validation = glucoseReadingSchema.partial().safeParse(data);
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const updated = await glucoseRepository.update(id, validation.data);
  if (!updated) {
    return { ok: false, error: "Registro não encontrado" };
  }

  recordAuditAsync("record.updated", "glucose", userId, id);

  return { ok: true, data: updated };
}

export async function listGlucoseReadings(
  userId: string,
  filter: GlucoseReadingFilter = {}
): Promise<ServiceResult<GlucoseReading[]>> {
  const records = await glucoseRepository.findByUser(userId, filter);
  return { ok: true, data: records };
}

export async function deleteGlucoseReading(
  userId: string,
  id: string
): Promise<ServiceResult<{ id: string }>> {
  const existing = await glucoseRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  await glucoseRepository.deleteById(id);
  recordAuditAsync("record.deleted", "glucose", userId, id);
  return { ok: true, data: { id } };
}