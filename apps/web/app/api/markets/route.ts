import "../../env.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type MarketItem = {
  sym: string;
  name: string;
  val: string;
  chg: string;
  pct: string;
  up: boolean;
  chain: ChainId;
  iconUrl?: string;
  url: string;
};
type MarketsPayload = { available: boolean; items: MarketItem[]; message?: string };
type ChainId = "base" | "solana";

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: {
    address?: string;
    symbol?: string;
    name?: string;
  };
  priceUsd?: string | null;
  priceChange?: {
    h24?: number;
  } | null;
  volume?: {
    h24?: number;
  };
  liquidity?: {
    usd?: number | null;
  } | null;
  info?: {
    imageUrl?: string;
  };
};

type DexMeta = {
  slug?: string;
};

type DexMetaResponse = {
  pairs?: DexPair[];
};

const CACHE_TTL_MS = 45_000;
const ITEMS_PER_CHAIN = 30;
const META_LIMIT = 30;
const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";
const CHAINS = [
  { id: "base", label: "BASE" },
  { id: "solana", label: "SOL" },
] satisfies Array<{ id: ChainId; label: string }>;
const SEARCH_QUERIES: Record<ChainId, string[]> = {
  base: ["base", "virtual", "aerodrome", "degen", "toshi"],
  solana: ["solana", "pump", "raydium", "bonk", "jupiter"],
};
const FETCH_HEADERS = {
  "accept": "application/json,text/html;q=0.9,*/*;q=0.8",
  "user-agent": "Mozilla/5.0 (compatible; FiresideNews/1.0; +https://localhost)",
};

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
  if (value >= 1_000) {
    return compactUsdFormatter.format(value);
  }

  if (value >= 0.01) {
    return usdFormatter.format(value);
  }

  return `$${value.toPrecision(3)}`;
}

function formatPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DEXSCREENER_BASE_URL}${path}`, { cache: "no-store", headers: FETCH_HEADERS });

  if (!response.ok) {
    throw new Error(`dexscreener ${path} ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchTrendingMetaPairs() {
  const metas = await fetchJson<DexMeta[]>("/metas/trending/v1");
  const slugs = metas.flatMap((meta) => (meta.slug ? [meta.slug] : [])).slice(0, META_LIMIT);
  const results = await Promise.allSettled(slugs.map((slug) => fetchJson<DexMetaResponse>(`/metas/meta/v1/${encodeURIComponent(slug)}`)));

  return results.flatMap((result) => (result.status === "fulfilled" ? (result.value.pairs ?? []) : []));
}

async function fetchSearchPairs(chainId: ChainId) {
  const results = await Promise.allSettled(
    SEARCH_QUERIES[chainId].map((query) => fetchJson<DexMetaResponse>(`/latest/dex/search?q=${encodeURIComponent(query)}`)),
  );

  return results.flatMap((result) => (result.status === "fulfilled" ? (result.value.pairs ?? []) : []));
}

async function fetchSupplementalPairs() {
  const results = await Promise.allSettled(CHAINS.map((chain) => fetchSearchPairs(chain.id)));
  return results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}

function getTopPairsByToken(chainId: ChainId, pairs: DexPair[]) {
  const bestPairs = new Map<string, DexPair>();

  for (const pair of pairs) {
    const tokenSymbol = pair.baseToken?.symbol?.toUpperCase();

    if (!tokenSymbol || pair.chainId !== chainId) {
      continue;
    }

    const key = `${chainId}:${tokenSymbol}`;
    const current = bestPairs.get(key);

    if (!current || getPairScore(pair) > getPairScore(current)) {
      bestPairs.set(key, pair);
    }
  }

  return bestPairs;
}

function getPairScore(pair: DexPair) {
  return pair.liquidity?.usd ?? pair.volume?.h24 ?? 0;
}

function pairToMarketItem(pair: DexPair, chainId: ChainId, chainLabel: string): MarketItem | null {
  const symbol = pair.baseToken?.symbol;
  const name = pair.baseToken?.name;
  const price = Number.parseFloat(pair.priceUsd ?? "");
  const change = pair.priceChange?.h24;

  if (!symbol || !name || !pair.url || !Number.isFinite(price) || typeof change !== "number") {
    return null;
  }

  return {
    sym: symbol.toUpperCase(),
    name,
    val: formatUsd(price),
    chg: formatPct(change),
    pct: "24H",
    up: change >= 0,
    chain: chainId,
    iconUrl: pair.info?.imageUrl,
    url: pair.url,
  };
}

function getChainMarketItems(metaPairs: DexPair[], supplementalPairs: DexPair[], chain: { id: ChainId; label: string }) {
  const metaTopPairs = [...getTopPairsByToken(chain.id, metaPairs).values()];
  const supplementalTopPairs = [...getTopPairsByToken(chain.id, supplementalPairs).values()];

  return [...getTopPairsByToken(chain.id, [...metaTopPairs, ...supplementalTopPairs]).values()]
    .sort((a, b) => getPairScore(b) - getPairScore(a))
    .flatMap((pair) => {
      const item = pairToMarketItem(pair, chain.id, chain.label);
      return item ? [item] : [];
    })
    .slice(0, ITEMS_PER_CHAIN);
}

export async function GET() {
  if (cachedPayload && cachedPayload.expiresAt > Date.now()) {
    return NextResponse.json(cachedPayload.payload, { headers: { "cache-control": "no-store" } });
  }

  const [metaPairs, supplementalPairs] = await Promise.all([fetchTrendingMetaPairs(), fetchSupplementalPairs()]);
  const items = CHAINS.flatMap((chain) => getChainMarketItems(metaPairs, supplementalPairs, chain));
  const payload: MarketsPayload =
    items.length > 0
      ? { available: true, items, message: "Dexscreener markets live" }
      : { available: false, items: [], message: "Markets feed offline" };

  if (items.length > 0) {
    cachedPayload = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
  }

  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}
