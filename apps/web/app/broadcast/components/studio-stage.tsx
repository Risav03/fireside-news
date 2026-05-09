"use client";

import type { NewsCategory } from "@repo/core";
import { CATEGORY_META } from "../category-meta";
import type { AnchorMode } from "../use-broadcast-settings";
import { AnchorScene } from "./scenes/anchor-scene";
import { MapScene } from "./scenes/map-scene";
import { WaveformScene } from "./scenes/waveform-scene";
import type { HeadlineRow } from "../use-headlines";

const lowerThirdToneClass = {
  live: "bg-[var(--brand)] after:bg-[var(--brand)]",
  crypto: "bg-[var(--crypto)] after:bg-[var(--crypto)]",
  stocks: "bg-[var(--stocks)] after:bg-[var(--stocks)]",
};

export function StudioStage({
  spotlight,
  breaking,
  anchorMode,
  rotationProgress,
  now,
}: {
  spotlight: HeadlineRow | null;
  breaking: boolean;
  anchorMode: AnchorMode;
  rotationProgress: number;
  now: Date;
}) {
  const category = (spotlight?.category ?? "news") as NewsCategory;
  const meta = CATEGORY_META[category] ?? CATEGORY_META.news;
  const hourEt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  }).format(now);

  const tagId = spotlight?.id ? spotlight.id.slice(-8).toUpperCase() : "--------";

  return (
    <div className="grid min-h-0">
      <div className="isolate relative min-h-0 overflow-hidden rounded border border-[var(--line)] bg-[#050608]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(46,125,255,0.20),transparent_70%),radial-gradient(ellipse_60%_40%_at_30%_30%,rgba(255,170,40,0.10),transparent_70%),linear-gradient(180deg,#0a1024_0%,#06070d_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,150,200,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,150,200,0.06)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_40%,transparent_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_50%,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

        {anchorMode === "anchor" ? <AnchorScene category={category} /> : null}
        {anchorMode === "waveform" ? <WaveformScene /> : null}
        {anchorMode === "map" ? <MapScene category={category} /> : null}

        <div className="absolute top-3.5 right-3.5 z-[5]">
          <div className="flex items-center gap-2.5 rounded-sm border border-[var(--line)] bg-black/55 px-2.5 py-1.5 text-[11px] font-bold tracking-[0.2em] backdrop-blur-[10px]">
            <span className="inline-flex items-center gap-1.5 text-[var(--brand)]">
              <span className="h-2 w-2 animate-blink rounded-full bg-white" /> ROTATING FEED
            </span>
            <span className="text-[var(--mute)]">FIRESIDE STUDIO · NYC</span>
          </div>
        </div>

        <div className="absolute top-3.5 left-3.5 z-[5]">
          <div className="flex flex-col items-start rounded-sm border border-[var(--line)] border-l-[3px] border-l-[var(--gold)] bg-black/55 px-3 py-1.5 leading-none backdrop-blur-[10px]">
            <div className="font-[var(--mono)] text-lg font-bold tracking-[0.06em] text-[var(--gold)]">
              {hourEt.padStart(2, "0")}:00
            </div>
            <div className="mt-1 text-[9px] font-bold tracking-[0.3em] text-[var(--mute)]">HOUR ET</div>
          </div>
        </div>

        {breaking ? (
          <div className="absolute top-[60px] left-1/2 z-[6] flex -translate-x-1/2 animate-breaking-in items-stretch border border-white/20 shadow-[0_8px_32px_rgba(200,30,30,0.4)]">
            <div className="relative grid place-items-center overflow-hidden bg-[var(--brand)] px-3 py-1.5 text-[11px] font-black tracking-[0.16em] text-white after:absolute after:inset-0 after:animate-flash-pulse after:bg-white/0 after:content-['']">
              BREAKING
            </div>
            <div className="grid place-items-center bg-black/75 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[var(--ink)]">DEVELOPING STORY — FIRESIDE NEWSROOM</div>
          </div>
        ) : null}

        <div className="absolute right-0 bottom-0 left-0 z-[5] grid grid-cols-[auto_1fr_auto] items-stretch border-t border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.55),rgba(8,10,18,0.92))] backdrop-blur">
          <div
            className={`relative flex min-w-[150px] flex-col justify-center px-[18px] py-3 after:absolute after:top-0 after:right-[-12px] after:bottom-0 after:w-6 after:[clip-path:polygon(0_0,50%_50%,0_100%)] after:content-[''] ${lowerThirdToneClass[meta.tone]}`}
          >
            <div className="font-[var(--display)] text-[22px] leading-none font-bold tracking-[0.04em] text-white">{meta.label}</div>
            <div className="mt-1.5 text-[11px] font-bold tracking-[0.24em] text-white/85">{meta.chyron}</div>
          </div>
          <div className="flex min-w-0 flex-col justify-center py-3.5 pr-7 pl-9">
            <div className="overflow-hidden text-pretty font-[var(--serif)] text-[clamp(16px,1.8vw,26px)] leading-[1.2] font-semibold tracking-[-0.005em] text-white [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {spotlight?.headline ?? "Fetching the latest briefing…"}
            </div>
            {spotlight ? (
              <div className="mt-2 overflow-hidden text-pretty font-[var(--sans)] text-[clamp(13px,1.15vw,17px)] leading-[1.35] font-[450] text-white/80 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                {spotlight.summary}
              </div>
            ) : null}
            <div className="mt-2.5 flex items-center gap-2.5 text-[11px] font-bold tracking-[0.2em] text-[var(--mute)]">
              <span>FIRESIDE NEWS</span>
              <span className="text-white/25">•</span>
              <span>{category.toUpperCase()} DESK</span>
              {spotlight ? (
                <>
                  <span className="text-white/25">•</span>
                  <span>{spotlight.source}</span>
                </>
              ) : null}
              {spotlight?.sourceUrl ? (
                <>
                  <span className="text-white/25">•</span>
                  <a className="text-inherit" href={spotlight.sourceUrl} target="_blank" rel="noopener noreferrer">
                    SOURCE
                  </a>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex min-w-20 flex-col items-center justify-center border-l border-[var(--line)] bg-white/5 px-[18px] py-3.5">
            <div className="text-[9px] font-bold tracking-[0.3em] text-[var(--mute)]">ID</div>
            <div className="mt-1 font-[var(--mono)] text-lg font-bold tracking-[0.04em] text-[var(--gold)]">{tagId}</div>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 left-0 z-[6] h-[3px] bg-white/10" aria-hidden>
          <div
            className="h-full bg-[linear-gradient(90deg,var(--gold),#FF7A1A,var(--brand))] shadow-[0_0_12px_rgba(255,170,40,0.6)] transition-[width] duration-[600ms] ease-linear"
            style={{ width: `${rotationProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
