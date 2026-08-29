import { activityRepository } from "../db/repositories/activity.repository";
import { glucoseRepository } from "../db/repositories/glucose.repository";
import { mealRepository } from "../db/repositories/meal.repository";
import { noteRepository } from "../db/repositories/note.repository";
import type {
  Activity,
  GlucoseReading,
  Meal,
  Note,
} from "../db/types";
import type {
  TimelineEvent,
  TimelineEventType,
  TimelineFilter,
  ServiceResult,
} from "./types";

/**
 * Consolidates glucose, meal, activity and note records into a single chrono
 * stream (newest first), honoring optional period and type filters.
 */
export async function listTimeline(
  userId: string,
  filter: TimelineFilter = {}
): Promise<ServiceResult<TimelineEvent[]>> {
  const range = { from: filter.from, to: filter.to };
  const selectedTypes = collectSelectedTypes(filter);

  const [glucose, meals, activities, notes] = await Promise.all([
    fetchRecordType("glucose", userId, selectedTypes, range),
    fetchRecordType("meal", userId, selectedTypes, range),
    fetchRecordType("activity", userId, selectedTypes, range),
    fetchRecordType("note", userId, selectedTypes, range),
  ]);

  const events: TimelineEvent[] = [];
  for (const record of glucose)
    events.push({ type: "glucose", id: record.id, at: record.measuredAt, data: record });
  for (const record of meals)
    events.push({ type: "meal", id: record.id, at: record.consumedAt, data: record });
  for (const record of activities)
    events.push({ type: "activity", id: record.id, at: record.startedAt, data: record });
  for (const record of notes)
    events.push({ type: "note", id: record.id, at: record.createdAt, data: record });

  events.sort((a, b) => b.at.localeCompare(a.at));
  return { ok: true, data: events };
}

function collectSelectedTypes(filter: TimelineFilter): Set<TimelineEventType> {
  const types = filter.types ?? (filter.type ? [filter.type] : undefined);
  return types ? new Set(types) : new Set();
}

async function fetchRecordType(
  type: "glucose",
  userId: string,
  selectedTypes: Set<TimelineEventType>,
  range: { from?: string; to?: string }
): Promise<GlucoseReading[]>;
async function fetchRecordType(
  type: "meal",
  userId: string,
  selectedTypes: Set<TimelineEventType>,
  range: { from?: string; to?: string }
): Promise<Meal[]>;
async function fetchRecordType(
  type: "activity",
  userId: string,
  selectedTypes: Set<TimelineEventType>,
  range: { from?: string; to?: string }
): Promise<Activity[]>;
async function fetchRecordType(
  type: "note",
  userId: string,
  selectedTypes: Set<TimelineEventType>,
  range: { from?: string; to?: string }
): Promise<Note[]>;
async function fetchRecordType(
  type: TimelineEventType,
  userId: string,
  selectedTypes: Set<TimelineEventType>,
  range: { from?: string; to?: string }
): Promise<GlucoseReading[] | Meal[] | Activity[] | Note[]> {
  if (selectedTypes.size > 0 && !selectedTypes.has(type)) return [];

  switch (type) {
    case "glucose":
      return glucoseRepository.findByUser(userId, range);
    case "meal":
      return mealRepository.findByUser(userId, range);
    case "activity":
      return activityRepository.findByUser(userId, range);
    case "note":
      return noteRepository.findByUser(userId, range);
  }
}