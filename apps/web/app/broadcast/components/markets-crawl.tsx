"use client";

import type { MarketItem } from "../use-markets";

export function MarketsCrawl({
  available,
  items,
  message,
}: {
  available: boolean;
  items: MarketItem[];
  message: string;
}) {
  const displayItems: MarketItem[] =
    available && items.length > 0
      ? items
      : [{ sym: "—", val: "", chg: message, pct: "", up: true }];

  const track = [...displayItems, ...displayItems];
  const speedSec = displayItems.length > 4 ? 90 : 50;

  return (
    <div className="grid h-[38px] grid-cols-[auto_1fr_auto] overflow-hidden border-t border-[var(--line)] bg-[#050608]">
      <div className="relative grid place-items-center bg-[var(--gold)] px-[18px] font-[var(--display)] text-[17px] font-bold tracking-[0.16em] text-[#1a1208] after:absolute after:top-0 after:right-[-10px] after:bottom-0 after:z-[2] after:w-5 after:bg-[var(--gold)] after:[clip-path:polygon(0_0,50%_50%,0_100%)] after:content-['']">
        MARKETS
      </div>
      <div className="relative flex items-center overflow-hidden">
        <div
          className="flex animate-scroll-left items-center gap-9 whitespace-nowrap pl-[30px] font-[var(--mono)] text-[13px] font-semibold text-[var(--ink)]"
          style={{ animationDuration: `${speedSec}s` }}
        >
          {track.map((m, i) => (
            <span className="inline-flex items-center gap-2.5" key={`${m.sym}-${i}`}>
              <span className={`font-bold tracking-[0.04em] ${available ? "text-[var(--gold)]" : "text-[var(--mute)]"}`}>{m.sym}</span>
              {m.val ? <span className={available ? "text-[var(--ink)]" : "text-[var(--mute)]"}>{m.val}</span> : null}
              <span className={available && m.sym !== "—" ? (m.up ? "text-[var(--green)]" : "text-[var(--red)]") : "text-[var(--mute)]"}>
                {available && m.sym !== "—" ? (
                  <>
                    {m.up ? "▲" : "▼"} {m.chg} {m.pct ? `(${m.pct})` : ""}
                  </>
                ) : (
                  m.chg
                )}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-[var(--brand)] px-4 text-[11px] font-extrabold tracking-[0.22em] text-white">
        <span className="h-2 w-2 animate-blink rounded-full bg-white" /> LIVE
      </div>
    </div>
  );
}
