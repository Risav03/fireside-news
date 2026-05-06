"use client";

import type { NowPlayingResponse } from "@repo/core";
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
import { useRadioPlayback } from "./use-radio-playback";

const FALLBACK_CURRENT: NowPlayingResponse["currentAudio"] = {
  audioId: "pending",
  durationSec: 1,
  startedAt: Date.now(),
  type: "stinger",
  title: "Preparing the live timeline…",
  category: "station",
  url: "",
  sourceUrl: null,
  priority: 0,
  publishedAt: null,
  offsetSec: 0,
  remainingSec: 1,
};

export function BroadcastShell() {
  const now = useClock();
  const { settings, update } = useBroadcastSettings();
  const {
    primaryRef,
    secondaryRef,
    musicRef,
    payload,
    status,
    error,
    progress,
    syncPlayback,
    analyserRef,
  } = useRadioPlayback();
  const { headlines, headlineError } = useHeadlines();
  const markets = useMarkets();

  const current = payload?.currentAudio ?? FALLBACK_CURRENT;

  const breaking = useMemo(() => {
    const p = current.priority ?? 0;
    if (settings.breakingMode === "off") {
      return false;
    }
    if (settings.breakingMode === "on") {
      return true;
    }
    return p >= 8;
  }, [current.priority, settings.breakingMode]);

  const playbackOk = status === "playing" && error === null;

  const shellStyle = {
    ["--brand" as string]: settings.networkColor,
  } as React.CSSProperties;

  return (
    <div className="broadcast" data-screen-label="01 Broadcast" data-skin={settings.skin} style={shellStyle}>
      <TopStrap
        now={now}
        rightSlot={<BroadcastSettingsPopover settings={settings} onChange={update} />}
      />

      {error || headlineError ? (
        <div className={`broadcast-status ${error ? "broadcast-status--error" : ""}`}>
          {[error, headlineError].filter(Boolean).join(" · ")}
        </div>
      ) : null}

      <div className="main">
        <div className="main__left">
          <NetworkBug
            live={status === "playing"}
            status={status}
            onUnmute={() => void syncPlayback(true)}
          />
          <StudioStage
            current={current}
            breaking={breaking}
            anchorMode={settings.anchorMode}
            progress={payload ? progress : 0}
            now={now}
            analyserRef={analyserRef}
          />
        </div>
        <Rundown nextAudio={payload?.nextAudio ?? []} playbackOk={playbackOk} />
      </div>

      <Ticker headlines={headlines} error={headlineError} />
      <MarketsCrawl available={markets.available} items={markets.items} message={markets.message ?? "Markets feed offline"} />

      <audio ref={primaryRef} preload="auto" playsInline />
      <audio ref={secondaryRef} preload="auto" playsInline />
      <audio ref={musicRef} src="/api/fallback-audio?kind=bed" loop preload="auto" />
    </div>
  );
}
