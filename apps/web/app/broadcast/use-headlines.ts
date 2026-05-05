"use client";

import { useEffect, useState } from "react";

export type HeadlineRow = {
  id: string;
  headline: string;
  category: string;
  priority: number;
  sourceUrl: string;
  publishedAt: string;
};

export function useHeadlines(pollMs = 60_000) {
  const [headlines, setHeadlines] = useState<HeadlineRow[]>([]);
  const [headlineError, setHeadlineError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/headlines?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`headlines ${res.status}`);
        }
        const data = (await res.json()) as { headlines: HeadlineRow[] };
        if (!cancelled) {
          setHeadlines(data.headlines ?? []);
          setHeadlineError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setHeadlineError(e instanceof Error ? e.message : "Headlines failed");
          setHeadlines([]);
        }
      }
    }

    void load();
    const id = setInterval(() => void load(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pollMs]);

  return { headlines, headlineError };
}
