"use client";

import type { TimelineSegment } from "@repo/core";
import { CATEGORY_META } from "../category-meta";

const etTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function Rundown({
  nextAudio,
  playbackOk,
}: {
  nextAudio: TimelineSegment[];
  playbackOk: boolean;
}) {
  return (
    <aside className="rundown">
      <div className="rundown__head">
        <div className="rundown__title">RUNDOWN</div>
        <div className="rundown__sub">NEXT IN QUEUE</div>
      </div>
      <ol className="rundown__list">
        {nextAudio.map((s, i) => {
          const meta = CATEGORY_META[s.category] ?? CATEGORY_META.news;
          return (
            <li key={`${s.audioId}-${s.startedAt}-${i}`} className={`rundown__item rundown__item--${meta.tone}`}>
              <div className="rundown__num">{String(i + 1).padStart(2, "0")}</div>
              <div className="rundown__body">
                <div className="rundown__cat">{meta.label}</div>
                <div className="rundown__hl">{s.title}</div>
                <div className="rundown__meta">
                  <span>{etTime.format(new Date(s.startedAt))} ET</span>
                  <span className="dotsep">•</span>
                  <span>{s.durationSec}s</span>
                  <span className="dotsep">•</span>
                  <span>{s.category.toUpperCase()}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="rundown__foot">
        <div className="rundown__foot-l">
          <span className={`dot ${playbackOk ? "dot--green" : ""}`} />
          <span>{playbackOk ? "FEED HEALTHY" : "SYNCING…"}</span>
        </div>
        <div className="rundown__foot-r">TIMELINE LIVE</div>
      </div>
    </aside>
  );
}
