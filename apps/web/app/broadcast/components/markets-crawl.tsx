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
    <div className="crawl">
      <div className="crawl__brand">MARKETS</div>
      <div className="crawl__rail">
        <div className={`crawl__track ${available ? "" : "crawl__track--muted"}`} style={{ animationDuration: `${speedSec}s` }}>
          {track.map((m, i) => (
            <span className="crawl__item" key={`${m.sym}-${i}`}>
              <span className="crawl__sym">{m.sym}</span>
              {m.val ? <span className="crawl__val">{m.val}</span> : null}
              <span className={`crawl__chg ${available && m.sym !== "—" ? (m.up ? "up" : "dn") : ""}`}>
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
      <div className="crawl__pill">
        <span className="dot" /> LIVE
      </div>
    </div>
  );
}
