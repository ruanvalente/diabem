import type { ZodError } from "zod";
import { fromDateTimeLocalValue } from "../date";

export function firstErrorMessage(validation: {
  error?: ZodError;
}): string {
  const issue = validation.error?.issues[0];
  return issue?.message ?? "Dados inválidos";
}

export function parseLocalDateTime(value: string): string | null {
  return fromDateTimeLocalValue(value);
}