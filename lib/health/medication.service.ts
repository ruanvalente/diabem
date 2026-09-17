import { medicationSchema } from "../db/schema";
import { medicationRepository } from "../db/repositories/medication.repository";
import type { Medication } from "../db/types";
import type {
  MedicationFilter,
  SaveMedicationInput,
  ServiceResult,
  UpdateMedicationInput,
} from "./types";
import { firstErrorMessage, parseLocalDateTime } from "./validation";
import { recordAuditAsync } from "../audit";

export async function createMedication(
  userId: string,
  input: SaveMedicationInput
): Promise<ServiceResult<Medication>> {
  const medicatedAt = parseLocalDateTime(input.medicatedAtLocal);
  if (!medicatedAt) {
    return { ok: false, error: "Data e horário inválidos" };
  }

  const validation = medicationSchema.safeParse({ ...input, medicatedAt });
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const now = new Date().toISOString();
  const record = await medicationRepository.create({
    userId,
    name: validation.data.name,
    dosage: validation.data.dosage,
    unit: validation.data.unit,
    frequency: validation.data.frequency,
    route: validation.data.route,
    medicatedAt: validation.data.medicatedAt,
    notes: validation.data.notes,
    provenance: {
      source: input.provenanceSource ?? "manual",
      recordedAt: now,
    },
  });

  recordAuditAsync("record.created", "medication", userId, record.id);

  return { ok: true, data: record };
}

/**
 * Updates a medication owned by `userId`. Optional text fields passed as
 * `undefined` (e.g. cleared in the edit form) are persisted as cleared; keys
 * omitted from `input` are left untouched.
 */
export async function updateMedication(
  userId: string,
  id: string,
  input: UpdateMedicationInput
): Promise<ServiceResult<Medication>> {
  const existing = await medicationRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  // Optional fields are sent as `undefined` when the user clears them in the
  // form. Presence checks (`in`) let those explicit clears reach the repository
  // instead of silently keeping the previously stored value.
  const data: Record<string, unknown> = {};
  if ("name" in input) data.name = input.name;
  if ("dosage" in input) data.dosage = input.dosage;
  if ("unit" in input) data.unit = input.unit;
  if ("frequency" in input) data.frequency = input.frequency;
  if ("route" in input) data.route = input.route;
  if ("notes" in input) data.notes = input.notes;
  if (input.medicatedAtLocal !== undefined) {
    const medicatedAt = parseLocalDateTime(input.medicatedAtLocal);
    if (!medicatedAt) {
      return { ok: false, error: "Data e horário inválidos" };
    }
    data.medicatedAt = medicatedAt;
  }

  const validation = medicationSchema.partial().safeParse(data);
  if (!validation.success) {
    return { ok: false, error: firstErrorMessage(validation) };
  }

  const updated = await medicationRepository.update(id, validation.data);
  if (!updated) {
    return { ok: false, error: "Registro não encontrado" };
  }

  recordAuditAsync("record.updated", "medication", userId, id);

  return { ok: true, data: updated };
}

export async function listMedications(
  userId: string,
  filter: MedicationFilter = {}
): Promise<ServiceResult<Medication[]>> {
  const records = await medicationRepository.findByUser(userId, filter);
  return { ok: true, data: records };
}

export async function deleteMedication(
  userId: string,
  id: string
): Promise<ServiceResult<{ id: string }>> {
  const existing = await medicationRepository.findById(id);
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "Registro não encontrado" };
  }

  await medicationRepository.deleteById(id);
  recordAuditAsync("record.deleted", "medication", userId, id);
  return { ok: true, data: { id } };
}