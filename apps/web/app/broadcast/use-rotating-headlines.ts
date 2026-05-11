"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const DEFAULT_DWELL_MS = 10_000;
const AUTO_RESUME_IDLE_MS = 120_000;
type DwellMs<T> = number | ((item: T, index: number) => number);

function resolveDwellMs<T>(dwellMs: DwellMs<T>, item: T | null, index: number) {
  if (typeof dwellMs !== "function" || !item) {
    return typeof dwellMs === "number" && Number.isFinite(dwellMs) && dwellMs > 0 ? dwellMs : DEFAULT_DWELL_MS;
  }

  const resolved = dwellMs(item, index);
  return Number.isFinite(resolved) && resolved > 0 ? resolved : DEFAULT_DWELL_MS;
}

/**
 * Advances through `items` locally (not synced across browsers).
 */
export function useRotatingHeadlines<T extends { id: string }>(items: T[], dwellMs: DwellMs<T> = DEFAULT_DWELL_MS) {
  const [index, setIndex] = useState(0);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [cycleStart, setCycleStart] = useState<number | null>(null);
  const [lastManualSelectionAt, setLastManualSelectionAt] = useState<number | null>(null);
  const rosterKey = useMemo(() => items.map((i) => i.id).join(","), [items]);
  const current = items.length === 0 ? null : items[index % items.length] ?? null;
  const currentDwellMs = useMemo(() => resolveDwellMs(dwellMs, current, index), [current, dwellMs, index]);

  useEffect(() => {
    setIndex(0);
    setLastManualSelectionAt(null);
  }, [rosterKey]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const now = Date.now();

    if (lastManualSelectionAt !== null) {
      const resumeInMs = AUTO_RESUME_IDLE_MS - (now - lastManualSelectionAt);

      if (resumeInMs > 0) {
        const id = window.setTimeout(() => setCycleStart(Date.now()), resumeInMs);
        return () => clearTimeout(id);
      }

      const resumeAt = lastManualSelectionAt + AUTO_RESUME_IDLE_MS;
      if (cycleStart === null || cycleStart < resumeAt) {
        setCycleStart(now);
        return;
      }
    }

    const elapsedMs = cycleStart === null ? 0 : Math.max(0, now - cycleStart);
    const id = window.setTimeout(() => {
      setCycleStart(Date.now());
      setIndex((p) => (p + 1) % items.length);
    }, Math.max(0, currentDwellMs - elapsedMs));

    return () => clearTimeout(id);
  }, [items.length, currentDwellMs, index, cycleStart, lastManualSelectionAt]);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setCycleStart(Date.now());
  }, [index, rosterKey]);

  const selectHeadline = useCallback(
    (id: string) => {
      const nextIndex = items.findIndex((item) => item.id === id);

      if (nextIndex < 0) {
        return;
      }

      const now = Date.now();
      setLastManualSelectionAt(now);
      setCycleStart(now);
      setIndex(nextIndex);
    },
    [items],
  );

  const autoplayPaused = lastManualSelectionAt !== null && nowMs !== null && nowMs - lastManualSelectionAt < AUTO_RESUME_IDLE_MS;
  const progress =
    autoplayPaused || items.length === 0 || nowMs === null || cycleStart === null
      ? 0
      : items.length <= 1
        ? 100
        : Math.min(100, ((nowMs - cycleStart) / currentDwellMs) * 100);

  return { current, index, progress, total: items.length, dwellMs: currentDwellMs, selectHeadline };
}
