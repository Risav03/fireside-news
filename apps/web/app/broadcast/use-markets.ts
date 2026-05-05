"use client";

import { useEffect, useState } from "react";

export type MarketItem = { sym: string; val: string; chg: string; pct: string; up: boolean };

type MarketsResponse = {
  available: boolean;
  items: MarketItem[];
  message?: string;
};

export function useMarkets(pollMs = 30_000) {
  const [data, setData] = useState<MarketsResponse>({
    available: false,
    items: [],
    message: "Markets feed offline",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/markets?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`markets ${res.status}`);
        }
        const json = (await res.json()) as MarketsResponse;
        if (!cancelled) {
          setData({
            available: Boolean(json.available && json.items?.length),
            items: json.items ?? [],
            message: json.message ?? "Markets feed offline",
          });
        }
      } catch {
        if (!cancelled) {
          setData({ available: false, items: [], message: "Markets feed offline" });
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

  return data;
}
