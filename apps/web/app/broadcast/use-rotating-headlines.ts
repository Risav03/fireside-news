"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_DWELL_MS = 10_000;

/**
 * Advances through `items` on a fixed interval locally (not synced across browsers).
 */
export function useRotatingHeadlines<T extends { id: string }>(items: T[], dwellMs = DEFAULT_DWELL_MS) {
  const [index, setIndex] = useState(0);
  const [, setPulse] = useState(0);
  const rosterKey = useMemo(() => items.map((i) => i.id).join(","), [items]);

  useEffect(() => {
    setIndex(0);
  }, [rosterKey]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const id = window.setInterval(() => {
      setIndex((p) => (p + 1) % items.length);
    }, dwellMs);

    return () => clearInterval(id);
  }, [items.length, dwellMs]);

  useEffect(() => {
    const id = window.setInterval(() => setPulse((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const [cycleStart, setCycleStart] = useState(() => Date.now());

  useEffect(() => {
    setCycleStart(Date.now());
  }, [index, rosterKey]);

  const current = items.length === 0 ? null : items[index % items.length] ?? null;

  const progress =
    items.length === 0 ? 0 : items.length <= 1 ? 100 : Math.min(100, ((Date.now() - cycleStart) / dwellMs) * 100);

  return { current, index, progress, total: items.length };
}
