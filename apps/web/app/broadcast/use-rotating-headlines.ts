"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_DWELL_MS = 10_000;
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
  const rosterKey = useMemo(() => items.map((i) => i.id).join(","), [items]);
  const current = items.length === 0 ? null : items[index % items.length] ?? null;
  const currentDwellMs = useMemo(() => resolveDwellMs(dwellMs, current, index), [current, dwellMs, index]);

  useEffect(() => {
    setIndex(0);
  }, [rosterKey]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const id = window.setTimeout(() => {
      setIndex((p) => (p + 1) % items.length);
    }, currentDwellMs);

    return () => clearTimeout(id);
  }, [items.length, currentDwellMs, index]);

  useEffect(() => {
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setCycleStart(Date.now());
  }, [index, rosterKey]);

  const progress =
    items.length === 0 || nowMs === null || cycleStart === null
      ? 0
      : items.length <= 1
        ? 100
        : Math.min(100, ((nowMs - cycleStart) / currentDwellMs) * 100);

  return { current, index, progress, total: items.length, dwellMs: currentDwellMs };
}
