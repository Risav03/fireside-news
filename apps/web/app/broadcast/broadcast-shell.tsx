"use client";

import { useMemo } from "react";
import { BroadcastSettingsPopover } from "./components/broadcast-settings";
import { MarketsCrawl } from "./components/markets-crawl";
import { NetworkBug } from "./components/network-bug";
import { Rundown } from "./components/rundown";
import { StudioStage } from "./components/studio-stage";
import { Ticker } from "./components/ticker";
import { TopStrap } from "./components/top-strap";
import "./broadcast.css";
import { useBroadcastSettings } from "./use-broadcast-settings";
import { useClock } from "./use-clock";
import { useHeadlines } from "./use-headlines";
import { useMarkets } from "./use-markets";
import { useRotatingHeadlines } from "./use-rotating-headlines";

export function BroadcastShell() {
  const now = useClock();
  const { settings, update } = useBroadcastSettings();
  const { headlines, headlineError, lastFetchedAt, refreshNow } = useHeadlines();
  const markets = useMarkets();

  const { current: spotlight, progress, index } = useRotatingHeadlines(headlines, 10_000);

  const breaking = useMemo(() => {
    const p = spotlight?.priority ?? 0;
    if (settings.breakingMode === "off") {
      return false;
    }
    if (settings.breakingMode === "on") {
      return true;
    }
    return p >= 8;
  }, [spotlight?.priority, settings.breakingMode]);

  const shellStyle = {
    ["--brand" as string]: settings.networkColor,
  } as React.CSSProperties;

  const rundownItems = useMemo(() => {
    if (headlines.length === 0) {
      return headlines;
    }
    const i = index % headlines.length;
    return [...headlines.slice(i), ...headlines.slice(0, i)];
  }, [headlines, index]);

  return (
    <div className="broadcast" data-screen-label="01 Broadcast" data-skin={settings.skin} style={shellStyle}>
      <TopStrap
        now={now}
        rightSlot={<BroadcastSettingsPopover settings={settings} onChange={update} />}
      />

      {headlineError ? (
        <div className="broadcast-status broadcast-status--error">
          {[headlineError].filter(Boolean).join(" · ")}
        </div>
      ) : null}

      <div className="main">
        <div className="main__left">
          <NetworkBug lastUpdatedAt={lastFetchedAt} onRefreshPress={() => void refreshNow()} />
          <StudioStage
            spotlight={spotlight}
            breaking={breaking}
            anchorMode={settings.anchorMode}
            rotationProgress={progress}
            now={now}
          />
        </div>
        <Rundown headlines={rundownItems} />
      </div>

      <Ticker headlines={headlines} error={headlineError} />
      <MarketsCrawl available={markets.available} items={markets.items} message={markets.message ?? "Markets feed offline"} />
    </div>
  );
}
