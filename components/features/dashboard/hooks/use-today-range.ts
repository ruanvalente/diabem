"use client";

import { useEffect, useState } from "react";
import { resolvePeriodRange } from "@/lib/date";

/**
 * Tracks the "today" period range, refreshing its boundaries whenever the
 * window regains focus so the dashboard stays aligned with the current day.
 */
export function useTodayRange() {
  const [todayRange, setTodayRange] = useState(() =>
    resolvePeriodRange("today"),
  );

  useEffect(() => {
    const refreshToday = () => setTodayRange(resolvePeriodRange("today"));
    window.addEventListener("focus", refreshToday);
    return () => window.removeEventListener("focus", refreshToday);
  }, []);

  return todayRange;
}
