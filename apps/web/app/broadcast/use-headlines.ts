"use client";

import { useCallback, useEffect, useState } from "react";

export type HeadlineRow = {
  id: string;
  headline: string;
  summary: string;
  category: string;
  priority: number;
  source: string;
  sourceUrl: string;
  publishedAt: string;
};

const POLL_MS = 900_000;

export function useHeadlines(pollMs = POLL_MS) {
  const [headlines, setHeadlines] = useState<HeadlineRow[]>([]);
  const [headlineError, setHeadlineError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const fetchHeadlines = useCallback(async () => {
    const res = await fetch(`/api/headlines?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`headlines ${res.status}`);
    }
    const data = (await res.json()) as { headlines: HeadlineRow[] };
    setHeadlines(data.headlines ?? []);
    setHeadlineError(null);
    setLastFetchedAt(new Date());
  }, []);

  const ingestThenFetch = useCallback(
    async (forceRefresh: boolean) => {
      try {
        const q = forceRefresh ? "&force=1" : "";
        await fetch(`/api/refresh-news?ts=${Date.now()}${q}`, { cache: "no-store" });
      } catch {
        // non-fatal
      }
      try {
        await fetchHeadlines();
      } catch (e) {
        setHeadlineError(e instanceof Error ? e.message : "Headlines failed");
        setHeadlines([]);
      }
    },
    [fetchHeadlines],
  );

  useEffect(() => {
    let cancelled = false;

    async function tick(force: boolean) {
      if (cancelled) {
        return;
      }
      await ingestThenFetch(force);
    }

    void tick(false);

    const id = setInterval(() => void tick(false), pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [ingestThenFetch, pollMs]);

  const refreshNow = useCallback(async () => {
    await ingestThenFetch(true);
  }, [ingestThenFetch]);

  return { headlines, headlineError, lastFetchedAt, refreshNow };
}
