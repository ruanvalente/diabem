"use client";

import type { TimelineEvent, TimelineFilter } from "@/lib/health/types";
import { listTimeline } from "@/lib/health/timeline.service";
import { useEntityRecords } from "./use-entity-records";

export function useTimeline(userId: string | null, defaultFilter?: TimelineFilter) {
  return useEntityRecords<TimelineEvent, TimelineFilter>(
    userId,
    listTimeline,
    defaultFilter
  );
}