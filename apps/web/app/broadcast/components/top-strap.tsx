"use client";

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
    <div className="grid h-9 grid-cols-[1fr_auto_1fr] items-center border-b border-[var(--line)] bg-[linear-gradient(180deg,#14171f,#0c0e14)] px-[18px] text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--mute)]">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex overflow-hidden rounded-[2px] bg-[var(--brand)] px-[9px] py-[3px] font-extrabold tracking-[0.22em] text-white before:absolute before:inset-0 before:translate-x-[-100%] before:animate-shine before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] before:content-['']">
          LIVE
        </span>
        <span className="font-bold text-[var(--ink)]">CH 24 — FIRESIDE NEWS</span>
      </div>
      <div className="text-center font-semibold text-[#d8dde6]">AI-GENERATED HEADLINES • UPDATED EVERY HOUR • STREAMING WORLDWIDE</div>
      <div className="flex justify-end gap-4 text-[#d8dde6]">
        <span>{date}</span>
        <span className="min-w-[9ch] text-right font-[var(--mono)] font-bold tracking-[0.06em] text-[var(--gold)]">{time} ET</span>
        {rightSlot}
      </div>
    </div>
  );
}
