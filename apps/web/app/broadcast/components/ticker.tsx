"use client";

import type { HeadlineRow } from "../use-headlines";

export function Ticker({
  headlines,
  error,
}: {
  headlines: HeadlineRow[];
  error: string | null;
}) {
  const items =
    headlines.length === 0
      ? [
          error
            ? `HEADLINE FEED ERROR — ${error}`
            : "Awaiting headlines from ingestion…",
        ]
      : headlines.flatMap((h) => `${h.category.toUpperCase()}: ${h.headline}`);

  const track = [...items, ...items];

  const speedSec = Math.max(40, 20 + items.length * 6);

  return (
    <div className="ticker">
      <div className="ticker__brand">
        <div className="ticker__brand-l">FIRESIDE</div>
        <div className="ticker__brand-s">HEADLINES</div>
      </div>
      <div className="ticker__rail">
        <div className="ticker__track" style={{ animationDuration: `${speedSec}s` }}>
          {track.map((text, i) => (
            <span className="ticker__item" key={`${i}-${text.slice(0, 24)}`}>
              <span className="ticker__star">◆</span>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
