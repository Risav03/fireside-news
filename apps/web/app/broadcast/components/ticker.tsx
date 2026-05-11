"use client";

import type { HeadlineRow } from "../use-headlines";

export function Ticker({
  headlines,
  error,
}: {
  headlines: HeadlineRow[];
  error: string | null;
}) {
  function teaser(summary: string) {
    const t = summary.trim();
    return t.length > 100 ? `${t.slice(0, 97)}…` : t;
  }

  const items =
    headlines.length === 0
      ? [
          error
            ? `HEADLINE FEED ERROR — ${error}`
            : "Awaiting headlines from ingestion…",
        ]
      : headlines.flatMap((h) => `${h.category.toUpperCase()}: ${h.headline} — ${teaser(h.summary)}`);

  const track = [...items, ...items];

  const speedSec = Math.max(90, 45 + items.length * 12);

  return (
    <div className="grid h-[50px] grid-cols-[auto_1fr] overflow-hidden border-y border-[var(--line)] bg-[linear-gradient(180deg,#15171f,#0c0e14)] max-[640px]:h-11">
      <div className="relative z-[2] flex flex-col justify-center bg-[var(--brand)] px-[22px] shadow-[8px_0_24px_rgba(0,0,0,0.4)] after:absolute after:top-0 after:right-[-14px] after:bottom-0 after:w-7 after:bg-[var(--brand)] after:[clip-path:polygon(0_0,50%_50%,0_100%)] after:content-[''] max-[640px]:px-3 max-[640px]:after:right-[-10px] max-[640px]:after:w-5">
        <div className="font-[var(--display)] text-[22px] leading-none font-bold tracking-[0.06em] text-white max-[640px]:text-[15px]">FIRESIDE</div>
        <div className="mt-1 text-[10px] font-bold tracking-[0.28em] text-white/75 max-[640px]:text-[8px] max-[640px]:tracking-[0.16em]">HEADLINES</div>
      </div>
      <div className="relative flex items-center overflow-hidden">
        <div
          className="flex animate-scroll-left items-center gap-[60px] whitespace-nowrap pl-[30px] font-[var(--serif)] text-lg font-semibold tracking-[0.005em] text-[var(--ink)] max-[640px]:gap-9 max-[640px]:pl-6 max-[640px]:text-sm"
          style={{ animationDuration: `${speedSec}s` }}
        >
          {track.map((text, i) => (
            <span className="inline-flex items-center gap-[18px]" key={`${i}-${text.slice(0, 24)}`}>
              <span className="text-sm text-[var(--gold)]">◆</span>
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
