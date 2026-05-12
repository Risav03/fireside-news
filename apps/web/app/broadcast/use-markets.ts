"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MarketItem = {
  sym: string;
  name: string;
  val: string;
  chg: string;
  pct: string;
  up: boolean;
  chain: "base" | "solana";
  iconUrl?: string;
  url: string;
};

type MarketsResponse = {
  available: boolean;
  items: MarketItem[];
  message?: string;
};

export function useMarkets() {
  const inFlightRef = useRef(false);
  const [data, setData] = useState<MarketsResponse>({
    available: false,
    items: [],
    message: "Markets feed offline",
  });

  const load = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      try {
        const res = await fetch(`/api/markets?ts=${Date.now()}`, { cache: "no-store", signal: options?.signal });
        if (!res.ok) {
          throw new Error(`markets ${res.status}`);
        }
        const json = (await res.json()) as MarketsResponse;
        setData({
          available: Boolean(json.available && json.items?.length),
          items: json.items ?? [],
          message: json.message ?? "Markets feed offline",
        });
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }

        setData({ available: false, items: [], message: "Markets feed offline" });
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load({ signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [load]);

  return { ...data, refreshNow: load };
}
