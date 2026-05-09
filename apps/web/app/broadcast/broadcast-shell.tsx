"use client";

import { useMemo } from "react";
import { BroadcastSettingsPopover } from "./components/broadcast-settings";
import { CardReader } from "./components/card-reader";
import { MarketsCrawl } from "./components/markets-crawl";
import { Ticker } from "./components/ticker";
import { TopStrap } from "./components/top-strap";
import { useBroadcastSettings } from "./use-broadcast-settings";
import { useClock } from "./use-clock";
import { useHeadlines } from "./use-headlines";
import { useMarkets } from "./use-markets";
import { useRotatingHeadlines } from "./use-rotating-headlines";

const MIN_CARD_DWELL_MS = 4_500;
const MAX_CARD_DWELL_MS = 18_000;
const BASE_CARD_DWELL_MS = 3_500;
const MS_PER_CARD_CHARACTER = 45;

const SKIN_VARS: Record<string, { bg: string; bg2: string }> = {
  primetime: { bg: "#050608", bg2: "#0a0c12" },
  morning: { bg: "#0e1320", bg2: "#131a2c" },
  wire: { bg: "#0b0b0d", bg2: "#15161a" },
};

function getCardDwellMs(item: { headline: string; summary: string }) {
  const readableTextLength = `${item.headline} ${item.summary}`.trim().length;
  return Math.min(MAX_CARD_DWELL_MS, Math.max(MIN_CARD_DWELL_MS, BASE_CARD_DWELL_MS + readableTextLength * MS_PER_CARD_CHARACTER));
}

export function BroadcastShell() {
  const now = useClock();
  const { settings, update } = useBroadcastSettings();
  const { headlines, headlineError, lastFetchedAt, refreshNow } = useHeadlines();
  const markets = useMarkets();

  const { current: spotlight, progress, index } = useRotatingHeadlines(headlines, getCardDwellMs);

  const skin = SKIN_VARS[settings.skin] ?? SKIN_VARS.primetime;
  const shellStyle = {
    ["--brand" as string]: settings.networkColor,
    ["--bg" as string]: skin.bg,
    ["--bg-2" as string]: skin.bg2,
  } as React.CSSProperties;

  const cardQueue = useMemo(() => {
    if (headlines.length === 0) {
      return headlines;
    }
    const i = index % headlines.length;
    return [...headlines.slice(i), ...headlines.slice(0, i)];
  }, [headlines, index]);

  return (
    <div
      className="grid h-screen min-h-screen grid-rows-[auto_1fr_auto_auto] overflow-hidden bg-[radial-gradient(ellipse_at_20%_0%,rgba(200,30,30,0.10),transparent_50%),radial-gradient(ellipse_at_100%_100%,rgba(46,125,255,0.08),transparent_55%),var(--bg)] font-[var(--sans)] font-medium tracking-[0.01em] text-[var(--ink)] antialiased"
      data-screen-label="01 Broadcast"
      data-skin={settings.skin}
      style={shellStyle}
    >
      <TopStrap
        now={now}
        rightSlot={<BroadcastSettingsPopover settings={settings} onChange={update} />}
      />

      {headlineError ? (
        <div className="col-span-full px-[18px] py-1 text-[11px] tracking-[0.08em] text-[#fca5a5]">
          {[headlineError].filter(Boolean).join(" · ")}
        </div>
      ) : null}

      <div className="grid min-h-0 grid-cols-[minmax(0,1180px)] justify-center p-[18px] max-[960px]:p-2.5">
        <CardReader
          headline={spotlight}
          queue={cardQueue}
          progress={progress}
          lastUpdatedAt={lastFetchedAt}
          onRefreshPress={() => void refreshNow()}
        />
      </div>

      <Ticker headlines={headlines} error={headlineError} />
      <MarketsCrawl available={markets.available} items={markets.items} message={markets.message ?? "Markets feed offline"} />
    </div>
  );
}
