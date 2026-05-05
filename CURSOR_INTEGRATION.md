# Fireside News — Broadcast UI Integration Guide for Cursor

This document tells Cursor how to take the broadcast-style UI in `Fireside News.html` (with `app.jsx`, `styles.css`, `tweaks-panel.jsx`) and wire it into the **real** Fireside News Next.js app at `apps/web/`.

> **CRITICAL: Do NOT use the mock data in `app.jsx`. All data must come from the existing repo APIs and the database.** The arrays `MOCK_HEADLINES`, `TICKER_HEADLINES`, and `MARKET_DATA` exist only as placeholders for the static HTML preview. Replace every one of them with live data from the endpoints below before shipping.

---

## 1. Where the broadcast UI plugs in

The repo already has `apps/web/app/radio-player.tsx` rendered by `apps/web/app/page.tsx`. Replace that page with a new broadcast component.

**Files to create / modify:**

```
apps/web/app/
├── page.tsx                       # render <BroadcastShell /> instead of <RadioPlayer />
├── broadcast/
│   ├── broadcast-shell.tsx        # client component — top-level layout, polls /api/now-playing
│   ├── top-strap.tsx              # date / live clock / channel ID
│   ├── network-bug.tsx            # FIRESIDE flame mark + LIVE badge
│   ├── studio-stage.tsx           # "video feed" + lower-third + breaking bug
│   ├── lower-third.tsx            # category nameplate, switches color by segment.category
│   ├── rundown.tsx                # right-rail queue, fed by NowPlayingResponse.nextAudio
│   ├── ticker.tsx                 # sliding headline ticker (live data)
│   ├── markets-crawl.tsx          # bottom market data crawl (live data)
│   ├── scenes/
│   │   ├── anchor-scene.tsx
│   │   ├── waveform-scene.tsx     # bind wave bars to RadioPlayer's analyser node
│   │   └── map-scene.tsx
│   └── broadcast.css              # port styles.css here, or convert to CSS modules
└── api/
    ├── ticker-headlines/route.ts  # NEW — see §3
    └── markets/route.ts           # NEW — see §3
```

Keep the audio-playback engine from the existing `radio-player.tsx`. Lift the playback logic into a `useRadioPlayback()` hook so `broadcast-shell.tsx` can both drive playback **and** read `payload`/`status` for the visuals.

---

## 2. Replacing the now-playing & rundown mock

`apps/web/app/api/now-playing/route.ts` already returns `NowPlayingResponse` (see `packages/core/src/types.ts`). Use it directly — do not duplicate.

In `broadcast-shell.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { NowPlayingResponse } from "@repo/core";

export function BroadcastShell() {
  const [payload, setPayload] = useState<NowPlayingResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const r = await fetch(`/api/now-playing?ts=${Date.now()}`, { cache: "no-store" });
      if (!cancelled && r.ok) setPayload(await r.json());
    }
    tick();
    const id = setInterval(tick, 5_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ...pass payload.currentAudio to <StudioStage /> and payload.nextAudio to <Rundown />
}
```

**Mapping for the lower-third / rundown:**

- `current.title` → lower-third headline (clamp to 2 lines)
- `current.category` → drives lower-third color: `news` → red, `crypto` → orange, `stocks` → blue, `station` → red bulletin
- `current.offsetSec / current.durationSec` → progress sliver
- `current.sourceUrl` → small "Read source" link in byline
- `payload.nextAudio[]` → rundown rows; format `startedAt` with `toLocaleTimeString`

**Delete these constants from `app.jsx` when porting:** `MOCK_HEADLINES` (replaced by `payload.currentAudio` + `payload.nextAudio`).

---

## 3. New API routes for ticker + markets

The mock `TICKER_HEADLINES` and `MARKET_DATA` arrays must be replaced with real endpoints.

### 3a. `apps/web/app/api/ticker-headlines/route.ts`

Pull recent processed headlines from Prisma — same source the radio uses, but as text only.

```ts
import "../../env.js";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.content.findMany({
    where: { article: { isNot: null } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { article: true },
  });

  const headlines = rows.map((r) => ({
    id: r.id,
    text: r.headline,
    category: r.article!.category,    // 'news' | 'crypto' | 'stocks'
    sourceUrl: r.article!.url,
    publishedAt: r.article!.publishedAt,
  }));

  return NextResponse.json({ headlines }, { headers: { "cache-control": "no-store" } });
}
```

The ticker component fetches this every 30–60s and renders `headlines[].text`. **Do not hardcode any sample headlines.**

### 3b. `apps/web/app/api/markets/route.ts`

Fetch real quotes server-side. Pick one of:

- **Stocks/indices**: Alpha Vantage, Finnhub, Polygon, or Yahoo Finance unofficial. (Add `MARKETS_API_KEY` to `.env`.)
- **Crypto**: CoinGecko `/simple/price` (free, no key) or Coinbase public API.

Sketch using CoinGecko + a stocks provider:

```ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 30;

const STOCKS = ["^GSPC", "^IXIC", "^DJI", "^RUT", "GC=F", "CL=F", "^TNX", "DX-Y.NYB", "^VIX"];
const CRYPTO_IDS = ["bitcoin", "ethereum", "solana"];

export async function GET() {
  const [stocksRes, cryptoRes] = await Promise.all([
    fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${STOCKS.join(",")}`,
      { next: { revalidate: 30 } }),
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS.join(",")}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }),
  ]);

  const stocks = (await stocksRes.json()).quoteResponse.result.map((q: any) => ({
    sym: q.shortName,
    val: q.regularMarketPrice?.toFixed(2),
    chg: q.regularMarketChange?.toFixed(2),
    pct: q.regularMarketChangePercent?.toFixed(2) + "%",
    up:  q.regularMarketChange >= 0,
  }));

  const cryptoJson = await cryptoRes.json();
  const crypto = CRYPTO_IDS.map((id) => ({
    sym: id.toUpperCase().slice(0, 3) + "/USD",
    val: cryptoJson[id].usd.toFixed(2),
    chg: cryptoJson[id].usd_24h_change?.toFixed(2),
    pct: cryptoJson[id].usd_24h_change?.toFixed(2) + "%",
    up:  cryptoJson[id].usd_24h_change >= 0,
  }));

  return NextResponse.json({ items: [...stocks, ...crypto] });
}
```

The markets-crawl component polls this every 30s. **Do not hardcode any prices, deltas, or percentages.**

---

## 4. Waveform scene → real audio

The `WaveformScene` in `app.jsx` simulates bars with `Math.sin`. In the real app, drive it from the actual playing audio:

```ts
const ctx = new AudioContext();
const src = ctx.createMediaElementSource(primaryAudioEl);
const analyser = ctx.createAnalyser();
analyser.fftSize = 128;
src.connect(analyser);
analyser.connect(ctx.destination);

// In rAF loop:
const data = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(data);
// map data[i] / 255 → bar heights
```

Pass the analyser through React context from `useRadioPlayback()` so `<WaveformScene />` can subscribe.

---

## 5. Porting the static files

1. `cp Fireside News.html` content's body markup into `broadcast-shell.tsx` JSX.
2. `cp styles.css` → `apps/web/app/broadcast/broadcast.css`. Import once at the top of `broadcast-shell.tsx`.
3. `cp tweaks-panel.jsx` → strip out — Tweaks is a design-only tool. Replace with a real settings menu if needed, or drop entirely.
4. Move all React component definitions out of `app.jsx` into the per-component `.tsx` files listed in §1.
5. Add the Google Fonts `<link>` from `Fireside News.html` to `apps/web/app/layout.tsx`.
6. Convert the `useNowPlaying` hook in `app.jsx` (which mocks the timeline) into a thin wrapper around the real `/api/now-playing` poller — see §2.

---

## 6. Things to delete

When porting, these MUST go:

- `MOCK_HEADLINES` array
- `TICKER_HEADLINES` array
- `MARKET_DATA` array
- The `useNowPlaying` interval that synthesises offsets from `MOCK_HEADLINES`
- Any `Math.sin`-driven fake values
- `tweaks-panel.jsx` and the `TweaksPanel` JSX in the App component

---

## 7. Acceptance checklist

- [ ] No `MOCK_*` / `SAMPLE_*` / hardcoded arrays remain anywhere in `apps/web/app/broadcast/`
- [ ] Lower-third updates within 5s of a new segment starting on the server
- [ ] Rundown reflects `payload.nextAudio` 1:1
- [ ] Ticker pulls from `/api/ticker-headlines`; refreshes every 30–60s
- [ ] Markets crawl pulls from `/api/markets`; refreshes every 30s
- [ ] Waveform scene is driven by the real `<audio>` element via Web Audio API
- [ ] Page works with autoplay blocked (button to start, same as old `RadioPlayer`)
- [ ] All env vars (`MARKETS_API_KEY`, etc.) added to `apps/web/app/env.ts`
- [ ] `bun run typecheck` passes from repo root
- [ ] `bun run lint` passes
