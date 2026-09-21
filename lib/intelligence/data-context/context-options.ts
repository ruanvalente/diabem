import type {
  DataContextIncludeOptions,
  DataContextOptions,
  DataContextPeriod,
} from "./data-context.types";

export type DataRecordKind =
  | "glucose"
  | "meals"
  | "activities"
  | "medications"
  | "notes";

export type DataContextSelection = {
  recordKinds: DataRecordKind[];
  statistics: boolean;
  insights: boolean;
  quality: boolean;
  provenance: boolean;
};

export type PeriodValidationResult =
  | { ok: true; period: DataContextPeriod }
  | { ok: false; error: string };

export type OptionsValidationResult =
  | { ok: true; period: DataContextPeriod }
  | { ok: false; error: string };

/**
 * Normalizes and validates a context period. Accepts any date parseable by
 * `Date` (ISO 8601, including date-only values), rejects missing bounds,
 * invalid dates and inverted ranges.
 */
export function validateDataContextPeriod(
  period: DataContextPeriod
): PeriodValidationResult {
  if (!period || typeof period.start !== "string" || typeof period.end !== "string") {
    return { ok: false, error: "Período inicial e final são obrigatórios." };
  }

  const start = new Date(period.start);
  const end = new Date(period.end);

  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Data inicial inválida." };
  }
  if (Number.isNaN(end.getTime())) {
    return { ok: false, error: "Data final inválida." };
  }
  if (start.getTime() > end.getTime()) {
    return { ok: false, error: "A data final deve ser igual ou posterior à inicial." };
  }

  return { ok: true, period: { start: start.toISOString(), end: end.toISOString() } };
}

/**
 * Single place that validates every `DataContextOptions` input before the
 * service touches any repository.
 */
export function validateDataContextOptions(
  options: DataContextOptions
): OptionsValidationResult {
  if (!options || typeof options.userId !== "string" || options.userId.trim() === "") {
    return { ok: false, error: "Usuário inválido: userId é obrigatório." };
  }
  return validateDataContextPeriod(options.period);
}

const DEFAULT_INCLUDE: Required<DataContextIncludeOptions> = {
  glucose: true,
  meals: true,
  activities: true,
  medications: true,
  notes: false,
  statistics: true,
  insights: true,
  quality: true,
  provenance: true,
};

/**
 * Merges the user-provided flags with the default selection. Record types not
 * listed in `include` follow the default (notes are excluded by default since
 * they are decrypted sensitive free text).
 */
export function resolveSelection(
  include?: DataContextIncludeOptions
): DataContextSelection {
  const selected = { ...DEFAULT_INCLUDE, ...include };

  const kinds: [DataRecordKind, boolean][] = [
    ["glucose", selected.glucose],
    ["meals", selected.meals],
    ["activities", selected.activities],
    ["medications", selected.medications],
    ["notes", selected.notes],
  ];

  const recordKinds: DataRecordKind[] = [];
  for (const [kind, enabled] of kinds) {
    if (enabled) recordKinds.push(kind);
  }

  return {
    recordKinds,
    statistics: selected.statistics,
    insights: selected.insights,
    quality: selected.quality,
    provenance: selected.provenance,
  };
}

const ANALYTICS_RECORD_KINDS: DataRecordKind[] = [
  "glucose",
  "meals",
  "activities",
];

export function shouldComputeAnalytics(
  selection: DataContextSelection
): boolean {
  if (!selection.statistics && !selection.insights && !selection.quality) {
    return false;
  }
  return selection.recordKinds.some((kind) => ANALYTICS_RECORD_KINDS.includes(kind));
}

export function hasSelection(selection: DataContextSelection): boolean {
  return selection.recordKinds.length > 0;
}