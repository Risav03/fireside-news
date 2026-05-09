"use client";

import { Sparkline } from "../sparkline";

export function AnchorScene({ category }: { category: string }) {
  return (
    <div className="absolute inset-0 grid place-items-[end_center]">
      <div className="absolute right-[8%] bottom-[88px] left-[8%] h-[110px] rounded-t-lg border-t-2 border-white/10 bg-[linear-gradient(180deg,#1a1f2e,#0a0d18)] shadow-[0_-8px_24px_rgba(0,0,0,0.4)] before:absolute before:top-7 before:left-1/2 before:-translate-x-1/2 before:font-[var(--display)] before:text-[28px] before:font-bold before:tracking-[0.16em] before:text-[var(--brand)] before:content-['FIRESIDE'] before:[text-shadow:0_0_12px_rgba(200,30,30,0.5)] after:absolute after:top-[60px] after:left-1/2 after:-translate-x-1/2 after:text-[12px] after:font-bold after:tracking-[0.4em] after:text-[var(--gold)] after:content-['NEWS']" />
      <div className="absolute bottom-[200px] left-[6%] aspect-[16/10] w-[22%] overflow-hidden rounded border border-[var(--line)] bg-[#0a0d18] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_0_24px_rgba(46,125,255,0.15)]">
        <div className="h-full w-full p-3">
          <Sparkline up />
        </div>
      </div>
      <div className="absolute right-[6%] bottom-[200px] aspect-[16/10] w-[22%] overflow-hidden rounded border border-[var(--line)] bg-[#0a0d18] shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_0_24px_rgba(46,125,255,0.15)]">
        <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle,rgba(200,30,30,0.25),transparent_70%)] p-3">
          <div className="font-[var(--display)] text-[64px] font-bold tracking-[0.04em] text-[var(--ink)] [text-shadow:0_0_18px_rgba(255,170,40,0.6)]">FN</div>
        </div>
      </div>
      <div className="absolute bottom-[88px] left-1/2 h-[220px] w-[200px] -translate-x-1/2">
        <div className="absolute bottom-[130px] left-1/2 h-20 w-[70px] -translate-x-1/2 rounded-[50%_50%_45%_45%] bg-[radial-gradient(ellipse_at_50%_30%,#d4a07a_0%,#8a614a_80%)] shadow-[inset_-8px_-4px_16px_rgba(0,0,0,0.3)]" />
        <div className="absolute bottom-[110px] left-1/2 h-[22px] w-[30px] -translate-x-1/2 rounded bg-[#8a614a]" />
        <div className="absolute bottom-0 left-1/2 h-[120px] w-[180px] -translate-x-1/2 bg-[linear-gradient(180deg,#1f2532_0%,#0e1118_100%)] shadow-[inset_0_8px_20px_rgba(255,255,255,0.05)] [clip-path:polygon(20%_0,80%_0,100%_100%,0_100%)] before:absolute before:top-0 before:left-1/2 before:h-[60px] before:w-4 before:-translate-x-1/2 before:bg-[#f5f5f5] before:[clip-path:polygon(50%_0,100%_8%,80%_100%,50%_70%,20%_100%,0_8%)] before:content-['']" />
      </div>
      <div className="absolute right-[8%] bottom-[110px] border-l-[3px] border-l-[var(--brand)] bg-black/60 px-3.5 py-2 font-bold tracking-[0.16em] backdrop-blur">
        <div className="text-sm text-white">FIRESIDE ANCHOR</div>
        <div className="mt-1 text-[10px] tracking-[0.22em] text-[var(--mute)]">AI NEWSROOM · {category.toUpperCase()} DESK</div>
      </div>
    </div>
  );
}
