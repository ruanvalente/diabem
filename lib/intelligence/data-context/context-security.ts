import type { DataContext } from "./data-context.types";

const INTERNAL_FIELDS: ReadonlySet<string> = new Set([
  "userId",
  "sourceKey",
  "passwordHash",
  "passwordSalt",
  "keySalt",
  "createdAt",
  "updatedAt",
]);

/**
 * Defense-in-depth guard applied in addition to the explicit normalization in
 * `context-normalizer.ts`: removes any internal field that may still be present
 * on a record. Records are always copied — the originals are never mutated.
 */
export function stripInternalFields<T extends Record<string, unknown>>(
  record: T
): T {
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!INTERNAL_FIELDS.has(key)) {
      copy[key] = value;
    }
  }
  return copy as T;
}

export function stripInternalFieldsFromRecords<T extends object>(
  records: T[]
): T[] {
  return records.map((record) => {
    const copy = { ...record };
    for (const field of INTERNAL_FIELDS) {
      delete copy[field as keyof T];
    }
    return copy;
  });
}

/**
 * Ownership filter: keeps only records belonging to the given user. The
 * repositories already scope queries by `userId`; this is a second line of
 * defense so that a repository bug could never leak another user's data into
 * the context.
 */
export function filterRecordsByUser<T extends { userId: string }>(
  records: T[],
  userId: string
): T[] {
  return records.filter((record) => record.userId === userId);
}

/**
 * Produces a non-sensitive summary of a context for logging/monitoring. It
 * contains only counts, period and version — no health values, free text,
 * provenance details or record ids.
 */
export function summarizeContextForLogging(
  context: DataContext
): {
  contextVersion: number;
  generatedAt: string;
  period: { start: string; end: string };
  recordCounts: {
    glucose: number;
    meals: number;
    activities: number;
    medications: number;
    notes: number;
  };
  derivedSections: string[];
} {
  return {
    contextVersion: context.contextVersion,
    generatedAt: context.generatedAt,
    period: context.period,
    recordCounts: {
      glucose: context.records.glucose.length,
      meals: context.records.meals.length,
      activities: context.records.activities.length,
      medications: context.records.medications.length,
      notes: context.records.notes.length,
    },
    derivedSections: [
      context.statistics ? "statistics" : null,
      context.insights ? "insights" : null,
      context.quality ? "quality" : null,
      context.provenance ? "provenance" : null,
    ].filter((section): section is string => section !== null),
  };
}