import { useEffect, useState } from "react";
import {
  resolvePeriodSelectionRange,
  type PeriodSelection,
} from "@/lib/date";

/**
 * Keeps the resolved date range in sync with the period selection.
 *
 * Refreshes on mount, when the period changes, when the window
 * regains focus, and when the document becomes visible again.
 */
export function usePeriodRange(period: PeriodSelection) {
  const [range, setRange] = useState(() =>
    resolvePeriodSelectionRange(period),
  );

  useEffect(() => {
    const refresh = () => setRange(resolvePeriodSelectionRange(period));

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [period]);

  return range;
}
