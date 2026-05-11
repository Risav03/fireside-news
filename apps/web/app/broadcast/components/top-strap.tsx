"use client";

import Logo from "./logo";

const etFormatterDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const etFormatterTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function TopStrap({ now, rightSlot }: { now: Date | null; rightSlot?: React.ReactNode }) {
  const date = now ? etFormatterDate.format(now) : "Loading date";
  const time = now ? etFormatterTime.format(now) : "--:--:--";

  return (
    <div className=" items-center gap-x-4 border-b border-[var(--line)] bg-[linear-gradient(180deg,#14171f,#0c0e14)] px-[18px] py-0 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--mute)] max-[720px]:grid-cols-[1fr_auto] max-[720px]:gap-y-1 max-[720px]:px-3 max-[720px]:py-2 max-[720px]:text-[10px] max-[720px]:tracking-[0.12em] py-2">
      <div className="flex w-full items-center gap-3 max-[720px]:gap-2 justify-between">
        <div className="flex items-center gap-2">
          {/* <span className="relative inline-flex overflow-hidden rounded-[2px] bg-[var(--brand)] px-[9px] py-[3px] font-extrabold tracking-[0.22em] text-white before:absolute before:inset-0 before:translate-x-[-100%] before:animate-shine before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] before:content-[''] max-[720px]:px-2 max-[720px]:py-1 max-[720px]:tracking-[0.14em]">
           <Logo/> LIVE
          </span> */}
          <Logo/>
        </div>

        <div className="flex justify-end gap-4 text-[#d8dde6] max-[720px]:gap-2">
        <span className="max-[720px]:hidden">{date}</span>
        <span className="min-w-[9ch] text-right font-[var(--mono)] font-bold tracking-[0.06em] text-[var(--gold)]">{time} ET</span>

      </div>
        
      </div>
      
      
    </div>
  );
}
