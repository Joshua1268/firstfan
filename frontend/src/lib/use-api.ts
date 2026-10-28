"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, asApiError } from "./api-client";

export function useApi<T>(
  fetcher: () => Promise<T>,
  opts: { refreshMs?: number } = {},
): { data: T | undefined; error: ApiError | undefined; loading: boolean; reload: () => void } {
  const { refreshMs } = opts;
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);

  // Callers pass an inline function: keep the latest one without restarting the effect.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let lastRequest = 0;

    async function load() {
      // A slow response must not overwrite a newer one.
      const request = ++lastRequest;
      const isCurrent = () => !cancelled && request === lastRequest;
      try {
        const result = await fetcherRef.current();
        if (isCurrent()) {
          setData(result);
          setError(undefined);
        }
      } catch (e) {
        if (isCurrent()) setError(asApiError(e));
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    function startPolling() {
      if (refreshMs && !timer && !document.hidden) timer = setInterval(load, refreshMs);
    }

    function stopPolling() {
      clearInterval(timer);
      timer = undefined;
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        load();
        startPolling();
      }
    }

    load();
    if (refreshMs) {
      startPolling();
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    return () => {
      cancelled = true;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshMs, reloadCount]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadCount((n) => n + 1);
  }, []);

  return { data, error, loading, reload };
}
