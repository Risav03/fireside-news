"use client";

import { CATEGORY_META } from "../category-meta";
import type { HeadlineRow } from "../use-headlines";

export function Rundown({
  headlines,
}: {
  headlines: HeadlineRow[];
}) {
  return (
    <aside className="rundown">
      <div className="rundown__head">
        <div className="rundown__title">RUNDOWN</div>
        <div className="rundown__sub">IN THIS CYCLE</div>
      </div>
      <ol className="rundown__list">
        {headlines.slice(0, 8).map((h, i) => {
          const meta = CATEGORY_META[h.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.news;
          return (
            <li key={`${h.id}-${i}`} className={`rundown__item rundown__item--${meta.tone}`}>
              <div className="rundown__num">{String(i + 1).padStart(2, "0")}</div>
              <div className="rundown__body">
                <div className="rundown__cat">{meta.label}</div>
                <div className="rundown__hl">{h.headline}</div>
                <div className="rundown__meta">
                  <span>{h.source}</span>
                  <span className="dotsep">•</span>
                  <span>{h.category.toUpperCase()}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="rundown__foot">
        <div className="rundown__foot-l">
          <span className="dot dot--green" />
          <span>TEXT FEED ACTIVE</span>
        </div>
        <div className="rundown__foot-r">LOCAL ROTATION</div>
      </div>
    </aside>
  );
}
