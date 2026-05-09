"use client";

import { CATEGORY_META } from "../category-meta";
import type { HeadlineRow } from "../use-headlines";

const borderToneClass = {
  live: "border-l-[var(--brand)]",
  crypto: "border-l-[var(--crypto)]",
  stocks: "border-l-[var(--stocks)]",
};

const textToneClass = {
  live: "text-[var(--brand)]",
  crypto: "text-[var(--crypto)]",
  stocks: "text-[var(--stocks)]",
};

export function Rundown({
  headlines,
}: {
  headlines: HeadlineRow[];
}) {
  return (
    <aside className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded border border-[var(--line)] bg-[linear-gradient(180deg,#0c0e14_0%,#08090e_100%)]">
      <div className="border-b border-l-4 border-b-[var(--line)] border-l-[var(--gold)] bg-[linear-gradient(180deg,#15171f,#0c0e14)] px-[18px] py-3.5">
        <div className="font-[var(--display)] text-[22px] leading-none font-bold tracking-[0.16em] text-[var(--gold)]">RUNDOWN</div>
        <div className="mt-1.5 text-[10px] font-bold tracking-[0.28em] text-[var(--mute)]">IN THIS CYCLE</div>
      </div>
      <ol className="flex list-none flex-col gap-1 overflow-y-auto p-1.5">
        {headlines.slice(0, 8).map((h, i) => {
          const meta = CATEGORY_META[h.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.news;
          return (
            <li
              key={`${h.id}-${i}`}
              className={`grid grid-cols-[36px_1fr] gap-3 border-l-[3px] bg-white/[0.02] px-3 py-3 transition-colors hover:bg-white/5 ${borderToneClass[meta.tone]}`}
            >
              <div className="self-start pt-0.5 font-[var(--mono)] text-lg font-bold tracking-[0.04em] text-[var(--mute)]">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div className={`text-[10px] font-extrabold tracking-[0.24em] ${textToneClass[meta.tone]}`}>{meta.label}</div>
                <div className="mt-1.5 text-pretty font-[var(--serif)] text-[14.5px] leading-[1.3] font-semibold text-[var(--ink)]">{h.headline}</div>
                <div className="mt-2 flex gap-2 text-[10px] font-bold tracking-[0.18em] text-[var(--mute)]">
                  <span>{h.source}</span>
                  <span className="text-white/25">•</span>
                  <span>{h.category.toUpperCase()}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between border-t border-[var(--line)] bg-[#050608] px-4 py-2.5 text-[10px] font-bold tracking-[0.22em] text-[var(--mute)]">
        <div className="flex items-center gap-2 text-[var(--green)]">
          <span className="h-2 w-2 animate-blink rounded-full bg-[var(--green)]" />
          <span>TEXT FEED ACTIVE</span>
        </div>
        <div>LOCAL ROTATION</div>
      </div>
    </aside>
  );
}
