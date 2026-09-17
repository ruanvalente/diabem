/**
 * Zod schemas for validating individual health records on the JSON import path.
 *
 * These schemas enforce the same shape, range and enum constraints that the
 * form layer enforces at entry time. When a record in a DiaBemExport JSON file
 * does not match, it is logged as an error and safely skipped rather than
 * imported into the database with corrupted or malicious data.
 *
 * Text fields are capped using the centralized length constants from
 * `lib/security/sanitization/text.ts`.
 */
import { z } from "zod";
import {
  MAX_NOTE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_MEDICATION_NAME_LENGTH,
  MAX_MEDICATION_DOSAGE_LENGTH,
  MAX_MEDICATION_TEXT_LENGTH,
} from "../../security/sanitization/text";
import {
  GLUCOSE_CONTEXT_VALUES,
  MEAL_TYPE_VALUES,
  ACTIVITY_TYPE_VALUES,
  DATA_SOURCE_VALUES,
} from "../../db/schema";

function isValidIsoDate(value: string): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  return !Number.isNaN(new Date(value).getTime());
}

/** ISO-8601 date-time string validator. */
const isoDateTime = z
  .string()
  .refine(isValidIsoDate, "Data inválida");

export const provenanceSchema = z
  .object({
    source: z.enum(DATA_SOURCE_VALUES, { message: "Origem inválida" }),
    sourceId: z.string().max(200, "Origem muito longa").optional(),
    importedAt: isoDateTime.optional(),
    recordedAt: isoDateTime,
  })
  .strict();

export const glucoseRecordSchema = z
  .object({
    id: z.string().optional(),
    value: z.number().min(0, "Valor inválido").max(1000, "Valor inválido"),
    unit: z.literal("mg/dL"),
    context: z.enum(GLUCOSE_CONTEXT_VALUES, { message: "Contexto inválido" }),
    measuredAt: isoDateTime,
    notes: z.string().max(MAX_NOTE_LENGTH, `Nota excede ${MAX_NOTE_LENGTH} caracteres`).optional(),
    sourceKey: z.string().optional(),
    provenance: provenanceSchema.optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

export const mealRecordSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(MEAL_TYPE_VALUES, { message: "Tipo inválido" }),
    description: z
      .string()
      .min(2, "Descrição inválida")
      .max(MAX_DESCRIPTION_LENGTH, `Descrição excede ${MAX_DESCRIPTION_LENGTH} caracteres`),
    consumedAt: isoDateTime,
    notes: z.string().max(MAX_NOTE_LENGTH, `Nota excede ${MAX_NOTE_LENGTH} caracteres`).optional(),
    sourceKey: z.string().optional(),
    provenance: provenanceSchema.optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

export const activityRecordSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(ACTIVITY_TYPE_VALUES, { message: "Tipo inválido" }),
    durationMinutes: z
      .number()
      .int("Duração inválida")
      .min(1, "Duração inválida")
      .max(1440, "Duração inválida"),
    startedAt: isoDateTime,
    notes: z.string().max(MAX_NOTE_LENGTH, `Nota excede ${MAX_NOTE_LENGTH} caracteres`).optional(),
    sourceKey: z.string().optional(),
    provenance: provenanceSchema.optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

export const noteRecordSchema = z
  .object({
    id: z.string().optional(),
    content: z
      .string()
      .min(1, "Conteúdo vazio")
      .max(MAX_CONTENT_LENGTH, `Conteúdo excede ${MAX_CONTENT_LENGTH} caracteres`),
    provenance: provenanceSchema.optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

/** Decimal dosage format (e.g. "500", "10", "1,5"). Mirrors `medicationSchema`. */
const medicationDosagePattern = /^\d+(?:[.,]\d+)?$/;

export const medicationRecordSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string()
      .min(1, "Nome inválido")
      .max(
        MAX_MEDICATION_NAME_LENGTH,
        `Nome excede ${MAX_MEDICATION_NAME_LENGTH} caracteres`,
      ),
    dosage: z
      .string()
      .max(
        MAX_MEDICATION_DOSAGE_LENGTH,
        `Dosagem excede ${MAX_MEDICATION_DOSAGE_LENGTH} caracteres`,
      )
      .refine(
        (value) => value.trim() === "" || medicationDosagePattern.test(value.trim()),
        "Formato de dosagem inválido",
      )
      .optional(),
    unit: z
      .string()
      .max(
        MAX_MEDICATION_TEXT_LENGTH,
        `Unidade excede ${MAX_MEDICATION_TEXT_LENGTH} caracteres`,
      )
      .optional(),
    frequency: z
      .string()
      .max(
        MAX_MEDICATION_TEXT_LENGTH,
        `Frequência excede ${MAX_MEDICATION_TEXT_LENGTH} caracteres`,
      )
      .optional(),
    route: z
      .string()
      .max(
        MAX_MEDICATION_TEXT_LENGTH,
        `Via excede ${MAX_MEDICATION_TEXT_LENGTH} caracteres`,
      )
      .optional(),
    medicatedAt: isoDateTime,
    notes: z.string().max(MAX_NOTE_LENGTH, `Nota excede ${MAX_NOTE_LENGTH} caracteres`).optional(),
    provenance: provenanceSchema.optional(),
    createdAt: isoDateTime,
    updatedAt: isoDateTime,
  })
  .strict();

type ZodRecordSchema = z.ZodObject;

function validateRecordArray<T>(
  records: unknown[],
  schema: ZodRecordSchema,
  recordTypeName: string,
  collectErrors: { recordIndex: number; field: string; message: string }[],
): T[] {
  const valid: T[] = [];

  records.forEach((raw, i) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      collectErrors.push({
        recordIndex: i,
        field: "record",
        message: `${recordTypeName} inválido: registro não é um objeto.`,
      });
      return;
    }

    const result = schema.safeParse(raw);
    if (result.success) {
      valid.push(result.data as T);
    } else {
      const issue = result.error.issues[0];
      const field = issue.path?.length ? issue.path.join(".") : "record";
      collectErrors.push({
        recordIndex: i,
        field,
        message: `${recordTypeName} inválido: ${issue.message}.`,
      });
    }
  });

  return valid;
}

export {
  validateRecordArray,
};
