import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";

export function glucoseReading(
  id: string,
  value: number,
  local: { y: number; mo: number; d: number; h: number; min?: number },
  userId = "u"
): GlucoseReading {
  const measuredAt = new Date(
    local.y,
    local.mo,
    local.d,
    local.h,
    local.min ?? 0
  ).toISOString();
  return {
    id,
    userId,
    value,
    unit: "mg/dL",
    context: "fasting",
    measuredAt,
    createdAt: measuredAt,
    updatedAt: measuredAt,
  };
}

export function meal(
  id: string,
  local: { y: number; mo: number; d: number; h: number; min?: number },
  userId = "u"
): Meal {
  const consumedAt = new Date(
    local.y,
    local.mo,
    local.d,
    local.h,
    local.min ?? 0
  ).toISOString();
  return {
    id,
    userId,
    type: "lunch",
    description: "Almoço",
    consumedAt,
    notes: undefined,
    createdAt: consumedAt,
    updatedAt: consumedAt,
  };
}

export function activity(
  id: string,
  local: { y: number; mo: number; d: number; h: number; min?: number },
  durationMinutes = 30,
  userId = "u"
): Activity {
  const startedAt = new Date(
    local.y,
    local.mo,
    local.d,
    local.h,
    local.min ?? 0
  ).toISOString();
  return {
    id,
    userId,
    type: "walking",
    durationMinutes,
    startedAt,
    notes: undefined,
    createdAt: startedAt,
    updatedAt: startedAt,
  };
}

export function note(
  id: string,
  local: { y: number; mo: number; d: number; h: number },
  userId = "u"
): Note {
  const createdAt = new Date(
    local.y,
    local.mo,
    local.d,
    local.h
  ).toISOString();
  return {
    id,
    userId,
    content: "Observação",
    createdAt,
    updatedAt: createdAt,
  };
}
