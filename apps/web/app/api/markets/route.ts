import "../../env.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MarketItem = { sym: string; val: string; chg: string; pct: string; up: boolean };
type MarketsPayload = { available: boolean; items: MarketItem[]; message?: string };

const CACHE_TTL_MS = 45_000;
const CRYPTO_IDS = [
  ["bitcoin", "BTC"],
  ["ethereum", "ETH"],
  ["solana", "SOL"],
] as const;
const STOCKS = [
  ["spy.us", "SPY"],
  ["aapl.us", "AAPL"],
  ["msft.us", "MSFT"],
  ["nvda.us", "NVDA"],
] as const;

let cachedPayload: { expiresAt: number; payload: MarketsPayload } | null = null;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const compactUsdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatUsd(value: number) {
  return value >= 1_000 ? compactUsdFormatter.format(value) : usdFormatter.format(value);
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

async function fetchCryptoItems(): Promise<MarketItem[]> {
  const ids = CRYPTO_IDS.map(([id]) => id).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`coingecko ${response.status}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;

  return CRYPTO_IDS.flatMap(([id, sym]) => {
    const price = data[id]?.usd;
    const pct = data[id]?.usd_24h_change;

    if (typeof price !== "number" || typeof pct !== "number") {
      return [];
    }

    return [{ sym, val: formatUsd(price), chg: formatPct(pct), pct: "24H", up: pct >= 0 }];
  });
}

function parseCsvLine(line: string) {
  return line.split(",").map((cell) => cell.trim());
}

async function fetchStockItem(symbol: string, sym: string): Promise<MarketItem | null> {
  const response = await fetch(`https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlc&h&e=csv`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`stooq ${response.status}`);
  }

  const text = await response.text();
  const rows = text.trim().split(/\r?\n/).map(parseCsvLine);
  const [, , , openRaw, , , closeRaw] = rows[1] ?? [];
  const open = Number.parseFloat(openRaw ?? "");
  const close = Number.parseFloat(closeRaw ?? "");

  if (!Number.isFinite(open) || !Number.isFinite(close) || open <= 0) {
    return null;
  }

  const change = close - open;
  const pct = (change / open) * 100;

  return { sym, val: formatUsd(close), chg: formatSigned(change), pct: formatPct(pct), up: change >= 0 };
}

async function fetchStockItems(): Promise<MarketItem[]> {
  const results = await Promise.allSettled(STOCKS.map(([symbol, sym]) => fetchStockItem(symbol, sym)));
  return results.flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));
}

function interleave<T>(left: T[], right: T[]) {
  const merged: T[] = [];
  const maxLength = Math.max(left.length, right.length);

  for (let i = 0; i < maxLength; i += 1) {
    if (left[i]) {
      merged.push(left[i]);
    }
    if (right[i]) {
      merged.push(right[i]);
    }
  }

  return merged;
}

export async function GET() {
  if (cachedPayload && cachedPayload.expiresAt > Date.now()) {
    return NextResponse.json(cachedPayload.payload, { headers: { "cache-control": "no-store" } });
  }

  const [cryptoResult, stockResult] = await Promise.allSettled([fetchCryptoItems(), fetchStockItems()]);
  const cryptoItems = cryptoResult.status === "fulfilled" ? cryptoResult.value : [];
  const stockItems = stockResult.status === "fulfilled" ? stockResult.value : [];
  const items = interleave(cryptoItems, stockItems);
  const payload: MarketsPayload =
    items.length > 0
      ? { available: true, items, message: "Markets live" }
      : { available: false, items: [], message: "Markets feed offline" };

  cachedPayload = { expiresAt: Date.now() + CACHE_TTL_MS, payload };

  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}
