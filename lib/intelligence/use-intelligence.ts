"use client";

import { useEffect, useRef, useState } from "react";
import type { GlucoseReading, Meal, Activity, Note } from "@/lib/db/types";
import type { AnalysisPeriod } from "./types/analytics.types";
import type { IntelligenceResult } from "./types/worker.types";
import { analyzeIntelligence } from "./intelligence.service";
import { IntelligenceWorkerAdapter } from "./worker/worker-adapter";

export type UseIntelligenceOptions = {
  glucose: GlucoseReading[];
  meals: Meal[];
  activities: Activity[];
  notes: Note[];
  period: AnalysisPeriod | null;
  enabled?: boolean;
  useWorker?: boolean;
};

/**
 * Runs the intelligence pipeline (analytics + rules + insights). When a Web
 * Worker is available and `useWorker` is true, the computation is offloaded to
 * keep the main thread responsive. Falls back to the synchronous service
 * otherwise. A monotonic request id discards stale results.
 */
export function useIntelligence({
  glucose,
  meals,
  activities,
  notes,
  period,
  enabled = true,
  useWorker = true,
}: UseIntelligenceOptions) {
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);
  const adapterRef = useRef<IntelligenceWorkerAdapter | null>(null);

  useEffect(() => {
    if (useWorker) {
      adapterRef.current = new IntelligenceWorkerAdapter();
      return () => {
        adapterRef.current?.terminate();
        adapterRef.current = null;
      };
    }
    return undefined;
  }, [useWorker]);

  useEffect(() => {
    if (!enabled || !period) {
      // Reset state when there is nothing to analyze; mirrors the record hooks'
      // pattern of syncing derived data from an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on disable
      setResult(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (useWorker && typeof window !== "undefined" && typeof Worker !== "undefined") {
      const adapter = adapterRef.current;
      if (adapter) {
        const requestId = `req-${++latestRequest.current}`;
        setIsLoading(true);
        setError(null);
        let cancelled = false;

        void (async () => {
          const response = await adapter.analyze(
            {
              type: "analyze",
              payload: {
                glucose,
                meals,
                activities,
                notes,
                period,
              },
            },
            requestId
          );
          if (cancelled || requestId !== `req-${latestRequest.current}`) return;

          if (response.type === "success") {
            setResult(response.payload);
          } else {
            setError(response.error.message);
          }
          setIsLoading(false);
        })();

        return () => {
          cancelled = true;
        };
      }
    }

    // Synchronous fallback path (worker unavailable or disabled).
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setError(null);
    let cancelled = false;

    void (async () => {
      await new Promise((r) => setTimeout(r, 0));
      const serviceResult = analyzeIntelligence(
        glucose,
        meals,
        activities,
        notes,
        period
      );
      if (cancelled || requestId !== latestRequest.current) return;

      if (serviceResult.ok) {
        setResult(serviceResult.data);
      } else {
        setError(serviceResult.error);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, period, glucose, meals, activities, notes, useWorker]);

  return { result, isLoading, error, insights: result?.insights ?? [] };
}
