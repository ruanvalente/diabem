"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ServiceResult } from "../types";

export type EntityFilter = {
  from?: string;
  to?: string;
};

type Loader<T, F> = (userId: string, filter: F) => Promise<ServiceResult<T[]>>;

/**
 * Thin controller over a health list service: manages loading state, cached
 * filters and record refresh after mutations. Page components own a single
 * instance and pass results down to their children.
 */
export function useEntityRecords<T, F extends EntityFilter>(
  userId: string | null,
  loader: Loader<T, F>,
  defaultFilter?: F
) {
  const [records, setRecords] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<F>(defaultFilter ?? ({} as F));
  const requestSeqRef = useRef(0);

  const reload = useCallback(async () => {
    if (!userId) {
      setRecords([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const requestId = ++requestSeqRef.current;
    const result = await loader(userId, filterRef.current);
    if (requestId !== requestSeqRef.current) return;

    setIsLoading(false);

    if (result.ok) {
      setRecords(result.data);
      setError(null);
    } else {
      setRecords([]);
      setError(result.error);
    }
  }, [userId, loader]);

  useEffect(() => {
    // Initial fetch on mount / userId change. IndexedDB reads are local and
    // the loading flag below is intentional; there is no external store to
    // synchronize with, so the synchronous setState is required.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void reload();
  }, [reload]);

  const applyFilters = useCallback(
    (filter: F) => {
      filterRef.current = filter;
      return reload();
    },
    [reload]
  );

  return { records, isLoading, error, reload, applyFilters };
}