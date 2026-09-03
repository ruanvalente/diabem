import type {
  NormalizedActivity,
  NormalizedGlucose,
  NormalizedMeal,
  NormalizedNote,
} from "../types/import.types";

export type DeduplicationResult<T> = {
  unique: T[];
  duplicateCount: number;
};

/**
 * Deduplicates glucose readings based on timestamp + value + context.
 * This handles cross-installation imports where IDs differ.
 */
export function deduplicateGlucose(
  records: NormalizedGlucose[],
  existingRecords: { measuredAt: string; value: number; context: string }[]
): DeduplicationResult<NormalizedGlucose> {
  const existingKeys = new Set(
    existingRecords.map(makeGlucoseKey)
  );

  const unique: NormalizedGlucose[] = [];
  let duplicateCount = 0;

  for (const record of records) {
    const key = makeGlucoseKey(record);
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }
    existingKeys.add(key);
    unique.push(record);
  }

  return { unique, duplicateCount };
}

/**
 * Deduplicates meals based on timestamp + type + description.
 */
export function deduplicateMeals(
  records: NormalizedMeal[],
  existingRecords: { consumedAt: string; type: string; description: string }[]
): DeduplicationResult<NormalizedMeal> {
  const existingKeys = new Set(
    existingRecords.map(makeMealKey)
  );

  const unique: NormalizedMeal[] = [];
  let duplicateCount = 0;

  for (const record of records) {
    const key = makeMealKey(record);
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }
    existingKeys.add(key);
    unique.push(record);
  }

  return { unique, duplicateCount };
}

/**
 * Deduplicates activities based on timestamp + type + duration.
 */
export function deduplicateActivities(
  records: NormalizedActivity[],
  existingRecords: { startedAt: string; type: string; durationMinutes: number }[]
): DeduplicationResult<NormalizedActivity> {
  const existingKeys = new Set(
    existingRecords.map(makeActivityKey)
  );

  const unique: NormalizedActivity[] = [];
  let duplicateCount = 0;

  for (const record of records) {
    const key = makeActivityKey(record);
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }
    existingKeys.add(key);
    unique.push(record);
  }

  return { unique, duplicateCount };
}

/**
 * Deduplicates notes based on timestamp + content.
 */
export function deduplicateNotes(
  records: NormalizedNote[],
  existingRecords: { createdAt: string; content: string }[]
): DeduplicationResult<NormalizedNote> {
  const existingKeys = new Set(
    existingRecords.map(makeNoteKey)
  );

  const unique: NormalizedNote[] = [];
  let duplicateCount = 0;

  for (const record of records) {
    const key = makeNoteKey(record);
    if (existingKeys.has(key)) {
      duplicateCount++;
      continue;
    }
    existingKeys.add(key);
    unique.push(record);
  }

  return { unique, duplicateCount };
}

function makeGlucoseKey(r: { measuredAt: string; value: number; context: string }): string {
  return `${r.measuredAt}|${r.value}|${r.context}`;
}

function makeMealKey(r: { consumedAt: string; type: string; description: string }): string {
  return `${r.consumedAt}|${r.type}|${r.description.toLowerCase()}`;
}

function makeActivityKey(r: { startedAt: string; type: string; durationMinutes: number }): string {
  return `${r.startedAt}|${r.type}|${r.durationMinutes}`;
}

function makeNoteKey(r: { createdAt: string; content: string }): string {
  return `${r.createdAt}|${r.content.toLowerCase()}`;
}
