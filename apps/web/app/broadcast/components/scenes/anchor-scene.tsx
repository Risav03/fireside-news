"use client";

import { Sparkline } from "../sparkline";

export function AnchorScene({ category }: { category: string }) {
  return (
    <div className="anchor">
      <div className="anchor__desk" />
      <div className="anchor__monitor monitor--l">
        <div className="monitor__inner monitor__inner--chart">
          <Sparkline up />
        </div>
      </div>
      <div className="anchor__monitor monitor--r">
        <div className="monitor__inner monitor__inner--logo">
          <div className="logo-mark">FN</div>
        </div>
      </div>
      <div className="anchor__figure">
        <div className="anchor__head" />
        <div className="anchor__neck" />
        <div className="anchor__torso" />
      </div>
      <div className="anchor__plaque">
        <div className="anchor__plaque-name">FIRESIDE ANCHOR</div>
        <div className="anchor__plaque-role">AI NEWSROOM · {category.toUpperCase()} DESK</div>
      </div>
    </div>
  );
}
