"use client";

import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 64;

/** Real analyser when available; deterministic idle animation otherwise. */
export function WaveformScene({ analyserRef }: { analyserRef: React.RefObject<AnalyserNode | null> }) {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 0.15));
  const tickRef = useRef(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    let raf = 0;

    function frame() {
      const analyser = analyserRef.current;
      if (analyser) {
        if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
          dataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)) as Uint8Array<ArrayBuffer>;
        }
        analyser.getByteFrequencyData(dataRef.current);
        const data = dataRef.current;
        const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
        const next: number[] = [];
        for (let i = 0; i < BAR_COUNT; i += 1) {
          let sum = 0;
          for (let j = 0; j < step; j += 1) {
            sum += data[i * step + j] ?? 0;
          }
          const avg = sum / step / 255;
          next.push(Math.max(0.08, avg));
        }
        setHeights(next);
      } else {
        tickRef.current += 1;
        const t = tickRef.current;
        const next = Array.from({ length: BAR_COUNT }, (_, i) => {
          const v =
            (Math.sin(i * 0.4 + t * 0.03) * 0.5 + 0.5) * 0.45 + (Math.sin(i * 0.13 + t * 0.02) * 0.5 + 0.5) * 0.25;
          return Math.max(0.08, v);
        });
        setHeights(next);
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef]);

  return (
    <div className="wave">
      <div className="wave__label">AUDIO FEED · ON AIR</div>
      <div className="wave__bars">
        {heights.map((b, i) => (
          <span key={i} style={{ height: `${b * 100}%` }} />
        ))}
      </div>
      <div className="wave__caption">FIRESIDE NEWS — LIVE TIMELINE</div>
    </div>
  );
}
