"use client";

export function NetworkBug({
  lastUpdatedAt,
  onRefreshPress,
}: {
  lastUpdatedAt: Date | null;
  onRefreshPress: () => void;
}) {
  const formatted =
    lastUpdatedAt === null
      ? "Waiting for headlines…"
      : new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(lastUpdatedAt);

  return (
    <div className="relative flex items-center gap-3.5 rounded-sm border border-[var(--line)] border-l-4 border-l-[var(--brand)] bg-[linear-gradient(180deg,#15171f_0%,#0c0e14_100%)] px-4 py-2.5">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_60%,rgba(255,150,40,0.25),transparent_70%)]">
        <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
          <path
            d="M16 3c2 5 7 6 7 12a7 7 0 1 1-14 0c0-3 2-5 4-7-1 4 1 6 3 6 0-4-2-6 0-11z"
            fill="url(#flame)"
          />
          <defs>
            <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFD86B" />
              <stop offset="0.5" stopColor="#FF7A1A" />
              <stop offset="1" stopColor="#eb6b34" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <div className="font-[var(--display)] text-[30px] font-bold tracking-[0.04em] text-[var(--ink)]">FIRESIDE</div>
        <div className="mt-1 text-[10px] font-bold tracking-[0.36em] text-[var(--brand)]">NEWS NETWORK</div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-sm bg-[var(--brand)] px-3 py-1.5 text-[12px] font-extrabold tracking-[0.2em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_24px_rgba(235,107,52,0.35)]"
          title="Headlines fetched from database"
        >
          <span className="h-2 w-2 animate-blink rounded-full bg-white" />
          HEADLINES
        </div>
        <div className="text-right text-[12px] text-[var(--mute)]">
          Updated {formatted}
        </div>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-3 py-1.5 text-[12px] font-extrabold tracking-[0.2em] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_6px_24px_rgba(235,107,52,0.35)] [font:inherit]"
          onClick={() => onRefreshPress()}
        >
          FETCH NOW
        </button>
      </div>
    </div>
  );
}
