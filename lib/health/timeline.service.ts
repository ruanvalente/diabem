import { activityRepository } from "../db/repositories/activity.repository";
import { glucoseRepository } from "../db/repositories/glucose.repository";
import { mealRepository } from "../db/repositories/meal.repository";
import { noteRepository } from "../db/repositories/note.repository";
import type { TimelineEvent, TimelineFilter, ServiceResult } from "./types";

/**
 * Consolidates glucose, meal, activity and note records into a single chrono
 * stream (newest first), honoring optional period and type filters.
 */
export async function listTimeline(
  userId: string,
  filter: TimelineFilter = {}
): Promise<ServiceResult<TimelineEvent[]>> {
  const range = { from: filter.from, to: filter.to };
  const type = filter.type;

  const [glucose, meals, activities, notes] = await Promise.all([
    fetchGlucose(userId, type, range),
    fetchMeals(userId, type, range),
    fetchActivities(userId, type, range),
    fetchNotes(userId, type, range),
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

async function fetchGlucose(
  userId: string,
  type: TimelineFilter["type"],
  range: { from?: string; to?: string }
) {
  if (type && type !== "glucose") return [];
  return glucoseRepository.findByUser(userId, range);
}

async function fetchMeals(
  userId: string,
  type: TimelineFilter["type"],
  range: { from?: string; to?: string }
) {
  if (type && type !== "meal") return [];
  return mealRepository.findByUser(userId, range);
}

async function fetchActivities(
  userId: string,
  type: TimelineFilter["type"],
  range: { from?: string; to?: string }
) {
  if (type && type !== "activity") return [];
  return activityRepository.findByUser(userId, range);
}

async function fetchNotes(
  userId: string,
  type: TimelineFilter["type"],
  range: { from?: string; to?: string }
) {
  if (type && type !== "note") return [];
  return noteRepository.findByUser(userId, range);
}