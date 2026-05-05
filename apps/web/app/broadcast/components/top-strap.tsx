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

export function TopStrap({ now, rightSlot }: { now: Date; rightSlot?: React.ReactNode }) {
  const date = etFormatterDate.format(now);
  const time = etFormatterTime.format(now);

  return (
    <div className="strap">
      <div className="strap__left">
        <span className="strap__pill">LIVE</span>
        <span className="strap__chan">CH 24 — FIRESIDE NEWS</span>
      </div>
      <div className="strap__center">AI-GENERATED HEADLINES • UPDATED EVERY HOUR • STREAMING WORLDWIDE</div>
      <div className="strap__right">
        <span>{date}</span>
        <span className="strap__time">{time} ET</span>
        {rightSlot}
      </div>
    </div>
  );
}
