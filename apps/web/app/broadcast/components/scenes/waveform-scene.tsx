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
    <div className="absolute inset-0 grid grid-rows-[auto_1fr_auto] items-center px-20 pt-20 pb-[140px]">
      <div className="text-center font-[var(--display)] text-[32px] font-bold tracking-[0.18em] text-[var(--brand)]">HEADLINES · ROTATION</div>
      <div className="flex h-[60%] items-center justify-center gap-1">
        {heights.map((b, i) => (
          <span
            className="w-2 rounded-sm bg-[linear-gradient(180deg,var(--gold),var(--brand))] shadow-[0_0_12px_rgba(255,170,40,0.4)] transition-[height] duration-100 ease-out"
            key={i}
            style={{ height: `${b * 100}%` }}
          />
        ))}
      </div>
      <div className="text-center text-[12px] font-bold tracking-[0.3em] text-[var(--mute)]">FIRESIDE NEWS — TEXT FEED</div>
    </div>
  );
}
