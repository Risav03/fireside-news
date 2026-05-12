# Fireside News — Broadcast UI Integration Brief

> **Hand-off for Cursor.** Replace the existing `apps/web/app/radio-player.tsx` UI with the broadcast-style frontend prototyped in `Fireside News.html` / `app.jsx` / `styles.css`. **Do not** carry over any of the mock arrays from the prototype — every value on screen must come from the real APIs and database that already exist in this monorepo.

---

## 1. What you are building

A cable-news-style "broadcast" view of the live audio timeline. Visual elements:

1. **Top strap** — channel id, "LIVE" pill, current date, ET clock (updates every second client-side).
2. **Network bug** — "FIRESIDE NEWS NETWORK" mark + flame logo + LIVE badge.
3. **Studio stage / "video feed"** — three modes selectable from Tweaks: `anchor`, `waveform`, `map`. The waveform is purely visual (no real audio analysis required); leave space for a future replacement with a real `<canvas>` analyser fed from the audio elements.
4. **Lower-third nameplate** — re-skins by `category` (`news` red / `crypto` orange / `stocks` blue / `station` red). Shows the **real current segment** title, category, duration, and segment id (`audioId`).
5. **Breaking-news bug** — shows when the current segment's `priority` (or another flag — see §4) is high enough.
6. **Rundown right rail** — driven by `nextAudio` from `/api/now-playing`.
7. **Sliding headline ticker** — driven by recent `Article` / processed `Content` rows from the DB (see §4).
8. **Markets crawl** — driven by a live markets feed (see §4). Until that endpoint exists, render a single skeleton row labelled "Markets feed offline" — **do not** ship hard-coded fake numbers.
9. **Audio playback** — preserve the existing dual-buffer crossfade logic from `radio-player.tsx`. The visual shell wraps it; the audio engine stays.

---

## 2. File layout in `apps/web`

```
apps/web/app/
├── page.tsx                      # unchanged — renders <Broadcast />
├── layout.tsx                    # unchanged
├── globals.css                   # REPLACE body with broadcast tokens (port styles.css here)
├── broadcast/
│   ├── broadcast.tsx             # top-level client component (replaces RadioPlayer)
│   ├── audio-engine.ts           # extract dual-buffer crossfade from old radio-player.tsx
│   ├── use-now-playing.ts        # hook polling /api/now-playing every 5s
│   ├── use-clock.ts              # 1Hz ticking clock
│   ├── use-ticker-headlines.ts   # hook for /api/headlines (see §4)
│   ├── use-markets.ts            # hook for /api/markets (see §4)
│   ├── components/
│   │   ├── top-strap.tsx
│   │   ├── network-bug.tsx
│   │   ├── studio-stage.tsx      # contains AnchorScene / WaveformScene / MapScene
│   │   ├── lower-third.tsx
│   │   ├── breaking-bug.tsx
│   │   ├── rundown.tsx
│   │   ├── ticker.tsx
│   │   └── markets-crawl.tsx
│   └── broadcast.module.css      # port styles.css here, namespaced
└── api/
    ├── now-playing/route.ts      # already exists
    ├── headlines/route.ts        # NEW — see §4
    └── markets/route.ts          # NEW — see §4
```

Use **CSS Modules** (`broadcast.module.css`) for the broadcast skin so the existing globals don't bleed.

---

## 3. Porting the prototype

Reference files in this project:

- `Fireside News.html` — page shell, font imports, script wiring
- `app.jsx` — every React component (TopStrap, NetworkBug, StudioStage, AnchorScene, WaveformScene, MapScene, Rundown, Ticker, MarketsCrawl, Sparkline)
- `styles.css` — every visual token, animation, lower-third skin

Translate JSX → TSX, `className` → `styles.foo` from CSS Module, and split each component into its own file as in §2.

**Drop these from the prototype outright** — they are placeholders that must not ship:

```
const MOCK_HEADLINES = [...]      // app.jsx
const TICKER_HEADLINES = [...]    // app.jsx
const MARKET_DATA = [...]         // app.jsx
function useNowPlaying() {...}    // app.jsx (the local-simulation version)
```

Replace each with the real data hook from §4.

---

## 4. Real data sources — required wiring

### 4a. Now-playing (already exists, just consume it)

```ts
// apps/web/app/broadcast/use-now-playing.ts
import type { NowPlayingResponse } from "@repo/core";

export function useNowPlaying() {
  const [payload, setPayload] = useState<NowPlayingResponse | null>(null);

  const sync = useCallback(async () => {
    const res = await fetch(`/api/now-playing?ts=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`now-playing ${res.status}`);
    setPayload(await res.json() as NowPlayingResponse);
  }, []);

  useEffect(() => {
    void sync();
    const id = setInterval(sync, 5_000);
    return () => clearInterval(id);
  }, [sync]);

  return payload;
}
```

- `payload.currentAudio` → `<LowerThird>` + `<StudioStage>`.
- `payload.nextAudio` → `<Rundown>`.
- `payload.currentAudio.offsetSec / durationSec` → progress sliver.

The existing `radio-player.tsx` already does this — extract that polling logic and the audio-buffer logic into `audio-engine.ts`. Do not rewrite the playback contract; the timeline service in `packages/core/src/timeline.service.ts` is authoritative.

### 4b. Ticker headlines — NEW endpoint

The DB already has `Article` and `Content` tables (see `packages/db` and `packages/core/src/types.ts`). Add a Next.js route handler that returns the most recent N processed headlines:

```ts
// apps/web/app/api/headlines/route.ts
import "../../env.js";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.content.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { article: true },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      headline: r.headline,
      category: r.article.category,
      priority: r.priority,
      sourceUrl: r.article.url,
      publishedAt: r.article.publishedAt,
    })),
    { headers: { "cache-control": "no-store" } },
  );
}
```

The `Ticker` component fetches this every 60s and renders `headline` strings into the existing infinite-scroll track. Do not synthesise category prefixes (`"BREAKING:"`, `"MARKETS:"`) — display the real `category` as a coloured tag inline.

**Breaking bug rule:** show `<BreakingBug>` only when `currentAudio.audioId` corresponds to a `Content` row whose `priority >= 8` (or whatever threshold the ingestion pipeline already uses). Add `priority` to the `TimelineSegment` type in `packages/core/src/types.ts` and surface it in `timeline.service.ts:loadTimelineAudio`.

### 4c. Markets crawl — NEW endpoint

There is **no markets data in this repo today**. Add a real provider and avoid paid-key requirements:

- **Dexscreener** for crypto token data. Use boosted/profile token endpoints for candidates, filter to Base and Solana, then hydrate prices with `/tokens/v1/{chainId}/{tokenAddresses}`.
- Cache responses for 30–60s to stay under public API quotas.

```ts
// apps/web/app/api/markets/route.ts
import "../../env.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TTL_SEC = 45;

export async function GET() {
  const payload = await fetchDexscreenerBaseAndSolanaMarkets();
  return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
}
```

Frontend hook polls `/api/markets` every 30s. If the response is empty or errors, render the rail with a single muted item: "Markets feed offline" — **never** fall back to baked-in numbers.

No market API key is required for the Dexscreener-backed implementation.

### 4d. Clock & date

`useClock()` runs purely client-side; that's fine. Use `Intl.DateTimeFormat` with `timeZone: "America/New_York"` so "ET" is honest regardless of where the server/browser sits.

---

## 5. Tweaks panel

The prototype uses an in-page Tweaks panel. **Drop the Tweaks panel entirely from the production app** — it is a design-time tool. Move the four knobs (network color, skin, anchor mode, breaking-bug override) into a small settings popover triggered from a gear icon in `<TopStrap>` and persist values to `localStorage`. Default skin: `primetime`.

The `breakingOn` toggle becomes an **override only** — by default the bug is driven by real `priority` (§4b). The toggle in settings is `auto | force-on | force-off`.

---

## 6. Audio engine — preserve, don't rewrite

Lift these refs and effects from the existing `radio-player.tsx` verbatim into `audio-engine.ts`:

- `primaryRef` / `secondaryRef` / `musicRef`
- `playSegment`, `syncPlayback`, `runSync`
- `stopAudio`, `fadeOut`, `nextFadeVersion`
- The `useEffect` that schedules the next sync at `(remainingSec - 1) * 1000`

Expose them as a `useAudioEngine(payload, manualStart)` hook the broadcast component drives. The visible "Tap to listen" CTA in the prototype is gone — replace it with a small unmute button on the network bug that surfaces only while `status === "blocked"`.

---

## 7. Type updates needed in `packages/core`

```ts
// packages/core/src/types.ts
export type TimelineSegment = {
  audioId: string;
  durationSec: number;
  startedAt: number;
  type: AudioType;
  title: string;
  category: NewsCategory | "station";
  url: string;
  sourceUrl: string | null;
  priority: number;        // NEW — 0–10, from Content.priority; station segments = 0
  publishedAt: number | null; // NEW — epoch ms, for "X mins ago" in rundown
};
```

Update `timeline.service.ts:loadTimelineAudio` to read `row.content?.priority ?? 0` and `row.content?.article.publishedAt`.

---

## 8. Acceptance checklist

- [ ] `/api/now-playing` drives current segment + rundown — **no mock arrays anywhere**.
- [ ] `/api/headlines` drives the ticker — empty state shows "Awaiting headlines from ingestion".
- [ ] `/api/markets` drives the crawl — empty state shows "Markets feed offline".
- [ ] Breaking bug visibility derives from `currentAudio.priority`.
- [ ] Audio playback continues to work (dual-buffer crossfade, music bed, autoplay-blocked recovery).
- [ ] No file in `apps/web/` contains hard-coded headlines, tickers, prices, or anchor names.
- [ ] All times rendered in ET via `Intl.DateTimeFormat`.
- [ ] Required env vars documented in `.env.example`.
- [ ] Lighthouse passes; no layout shift on the ticker.
- [ ] Works in mobile viewport (≤960px) — collapse rundown under the stage; ticker + crawl span full width.

---

## 9. Out of scope for this pass

- Replacing the CSS anchor placeholder with a real generated/streamed video feed.
- Wiring the waveform to actual audio analysis.
- Multi-channel switching (CHANNEL_ID is a server-side env var; UI stays single-channel).
- Auth, paywall, viewer counts.
