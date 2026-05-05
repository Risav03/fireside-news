"use client";

import type { NowPlayingResponse } from "@repo/core";
import { CATEGORY_META } from "../category-meta";
import type { AnchorMode } from "../use-broadcast-settings";
import { AnchorScene } from "./scenes/anchor-scene";
import { MapScene } from "./scenes/map-scene";
import { WaveformScene } from "./scenes/waveform-scene";

type Current = NowPlayingResponse["currentAudio"];

export function StudioStage({
  current,
  breaking,
  anchorMode,
  progress,
  now,
  analyserRef,
}: {
  current: Current;
  breaking: boolean;
  anchorMode: AnchorMode;
  progress: number;
  now: Date;
  analyserRef: React.RefObject<AnalyserNode | null>;
}) {
  const meta = CATEGORY_META[current.category] ?? CATEGORY_META.news;
  const hourEt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  }).format(now);

  const tagId = String(current.audioId).slice(-8).toUpperCase();

  return (
    <div className="stage">
      <div className={`feed feed--${anchorMode}`}>
        <div className="feed__bg" />
        <div className="feed__grid" />
        <div className="feed__vignette" />

        {anchorMode === "anchor" ? <AnchorScene category={current.category} /> : null}
        {anchorMode === "waveform" ? <WaveformScene analyserRef={analyserRef} /> : null}
        {anchorMode === "map" ? <MapScene category={current.category} /> : null}

        <div className="feed__topright">
          <div className="ostg">
            <span className="ostg__live">
              <span className="dot" /> LIVE
            </span>
            <span className="ostg__loc">FIRESIDE STUDIO · NYC</span>
          </div>
        </div>

        <div className="feed__topleft">
          <div className="hour-bug">
            <div className="hour-bug__num">
              {hourEt.padStart(2, "0")}:00
            </div>
            <div className="hour-bug__lbl">HOUR ET</div>
          </div>
        </div>

        {breaking ? (
          <div className="breaking">
            <div className="breaking__flash">BREAKING</div>
            <div className="breaking__text">DEVELOPING STORY — FIRESIDE NEWSROOM</div>
          </div>
        ) : null}

        <div className={`lower3 lower3--${meta.tone}`}>
          <div className="lower3__cat">
            <div className="lower3__cat-lbl">{meta.label}</div>
            <div className="lower3__cat-sub">{meta.chyron}</div>
          </div>
          <div className="lower3__main">
            <div className="lower3__title">{current.title}</div>
            <div className="lower3__byline">
              <span>FIRESIDE NEWS</span>
              <span className="dotsep">•</span>
              <span>{current.category.toUpperCase()} DESK</span>
              <span className="dotsep">•</span>
              <span>{current.durationSec}s SEGMENT</span>
              {current.sourceUrl ? (
                <>
                  <span className="dotsep">•</span>
                  <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                    SOURCE
                  </a>
                </>
              ) : null}
            </div>
          </div>
          <div className="lower3__tag">
            <div className="lower3__tag-l">ID</div>
            <div className="lower3__tag-n">{tagId}</div>
          </div>
        </div>

        <div className="feed__progress" aria-hidden>
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
