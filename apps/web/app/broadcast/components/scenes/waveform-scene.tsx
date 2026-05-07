"use client";

import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 64;

/** Decorative waveform (no audio input). */
export function WaveformScene() {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.15));
  const tickRef = useRef(0);

  useEffect(() => {
    let raf = 0;

    function frame() {
      tickRef.current += 1;
      const t = tickRef.current;
      const next = Array.from({ length: BAR_COUNT }, (_, i) => {
        const v =
          (Math.sin(i * 0.4 + t * 0.03) * 0.5 + 0.5) * 0.45 + (Math.sin(i * 0.13 + t * 0.02) * 0.5 + 0.5) * 0.25;
        return Math.max(0.08, v);
      });
      setHeights(next);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="wave">
      <div className="wave__label">HEADLINES · ROTATION</div>
      <div className="wave__bars">
        {heights.map((b, i) => (
          <span key={i} style={{ height: `${b * 100}%` }} />
        ))}
      </div>
      <div className="wave__caption">FIRESIDE NEWS — TEXT FEED</div>
    </div>
  );
}
