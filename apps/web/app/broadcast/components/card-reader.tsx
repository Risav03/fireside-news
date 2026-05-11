"use client";

import { CATEGORY_META } from "../category-meta";
import type { HeadlineRow } from "../use-headlines";

const cardToneClass = {
  live: "bg-[radial-gradient(ellipse_at_15%_0%,rgba(235,107,52,0.16),transparent_48%),radial-gradient(ellipse_at_100%_100%,rgba(235,107,52,0.10),transparent_45%),linear-gradient(180deg,rgba(21,23,31,0.96),rgba(8,9,14,0.98))]",
  crypto: "bg-[radial-gradient(ellipse_at_15%_0%,rgba(247,147,26,0.18),transparent_48%),linear-gradient(180deg,rgba(21,23,31,0.96),rgba(8,9,14,0.98))]",
  stocks: "bg-[radial-gradient(ellipse_at_15%_0%,rgba(235,107,52,0.18),transparent_48%),linear-gradient(180deg,rgba(21,23,31,0.96),rgba(8,9,14,0.98))]",
};

const borderToneClass = {
  live: "border-t-[var(--brand)]",
  crypto: "border-t-[var(--crypto)]",
  stocks: "border-t-[var(--stocks)]",
};

const textToneClass = {
  live: "text-[var(--brand)]",
  crypto: "text-[var(--crypto)]",
  stocks: "text-[var(--stocks)]",
};

export function CardReader({
  headline,
  queue,
  progress,
  lastUpdatedAt,
  onRefreshPress,
  onSelectHeadline,
}: {
  headline: HeadlineRow | null;
  queue: HeadlineRow[];
  progress: number;
  lastUpdatedAt: Date | null;
  onRefreshPress: () => void;
  onSelectHeadline: (id: string) => void;
}) {
  const category = headline?.category as keyof typeof CATEGORY_META | undefined;
  const meta = category ? (CATEGORY_META[category] ?? CATEGORY_META.news) : CATEGORY_META.news;
  const publishedAt = headline?.publishedAt ? new Date(headline.publishedAt) : null;
  const canNavigate = queue.length > 1;
  const previousHeadline = canNavigate ? queue[queue.length - 1] : null;
  const nextHeadline = canNavigate ? queue[1] : null;

  return (
    <section className="grid gap-4 pb-32 max-[960px]:gap-2.5 max-[640px]:gap-2" aria-label="News cards">
      {/* <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] border-l-4 border-l-[var(--brand)] bg-[linear-gradient(180deg,#15171f,#0c0e14)] px-4 py-3 max-[640px]:items-start max-[640px]:gap-3 max-[640px]:px-3 max-[640px]:py-2.5">
        <div className="min-w-0">
          <div className="font-[var(--display)] text-[22px] font-bold tracking-[0.12em] max-[640px]:text-[18px] max-[640px]:tracking-[0.08em]">FIRESIDE NEWS</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mute)]">
            {lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading latest cards"}
          </div>
        </div>
        <button
          type="button"
          className="min-h-11 cursor-pointer appearance-none rounded-full border border-white/15 bg-white/5 px-4 py-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-white/10 max-[640px]:px-3 max-[640px]:text-[11px] max-[640px]:tracking-[0.08em]"
          onClick={onRefreshPress}
        >
          Refresh
        </button>
      </div> */}

      <article className={`relative flex h-[60vh] min-h-[420px] flex-col gap-3 overflow-y-auto rounded-[18px] border border-[var(--line)] p-[clamp(16px,2.8vw,32px)] shadow-[0_28px_80px_rgba(0,0,0,0.35)] max-[960px]:min-h-[46vh] max-[960px]:gap-2.5 max-[960px]:p-4 max-[640px]:min-h-0 max-[640px]:rounded-xl max-[640px]:p-3 ${cardToneClass[meta.tone]}`}>
        <div className="absolute inset-x-0 top-0 h-[5px] bg-white/10" aria-hidden>
          <div className="h-full bg-[linear-gradient(90deg,var(--gold),#FF7A1A,var(--brand))] transition-[width] duration-[600ms] ease-linear" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--mute)] max-[640px]:gap-x-3 max-[640px]:text-[9px] max-[640px]:tracking-[0.1em]">
            <span className="text-[var(--gold)]">{meta.label}</span>
            {headline ? <span>{headline.source}</span> : null}
            {publishedAt && !Number.isNaN(publishedAt.getTime()) ? (
              <span>{publishedAt.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            ) : null}
          </div>
          
          <div>
            <h1 className="m-0 max-w-[28ch] mb-4 text-balance font-[var(--serif)] text-[clamp(32px,5vw,52px)]  leading-[1] font-semibold tracking-[-0.04em] max-[960px]:max-w-none max-[640px]:text-[clamp(28px,9vw,36px)] max-[640px]:leading-[1.04]">
              {headline?.headline ?? "Fetching the latest briefing..."}
            </h1>
            {headline ? <p className="m-0 max-w-[68ch] text-pretty text-[clamp(16px,1.8vw,24px)] leading-[1.32] text-white/85 max-[640px]:text-[15px] max-[640px]:leading-[1.4]">{headline.summary}</p> : null}

          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--mute)] max-[640px]:gap-x-3 max-[640px]:pt-0 max-[640px]:text-[9px] max-[640px]:tracking-[0.1em]">
            <span>{meta.chyron}</span>
            {headline?.sourceUrl ? (
              <a className="text-[var(--gold)] no-underline hover:underline" href={headline.sourceUrl} target="_blank" rel="noopener noreferrer">
                Read source
              </a>
            ) : null}
          </div>

        </div>

      </article>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 font-[var(--display)] text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:border-[var(--brand)] hover:bg-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-35 max-[640px]:flex-1 max-[640px]:px-3"
          aria-label="Show previous news card"
          disabled={!previousHeadline}
          onClick={() => {
            if (previousHeadline) {
              onSelectHeadline(previousHeadline.id);
            }
          }}
        >
          Prev
        </button>
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 font-[var(--display)] text-[12px] font-bold uppercase tracking-[0.14em] text-white transition hover:border-[var(--brand)] hover:bg-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-35 max-[640px]:flex-1 max-[640px]:px-3"
          aria-label="Show next news card"
          disabled={!nextHeadline}
          onClick={() => {
            if (nextHeadline) {
              onSelectHeadline(nextHeadline.id);
            }
          }}
        >
          Next
        </button>
      </div>

      {queue.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 max-[960px]:grid-cols-1 max-[640px]:flex max-[640px]:snap-x max-[640px]:gap-2 max-[640px]:overflow-x-auto max-[640px]:pb-2" aria-label="Upcoming cards">
          {queue.slice(0, 4).map((item) => {
            const itemMeta = CATEGORY_META[item.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.news;
            const isCurrent = item.id === headline?.id;
            return (
              <button
                type="button"
                key={item.id}
                aria-current={isCurrent ? "true" : undefined}
                className={`flex min-h-[138px] cursor-pointer flex-col items-start rounded-[10px] bg-white/[0.035] p-4 text-left text-[var(--ink)] transition hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] max-[640px]:min-h-[132px] max-[640px]:w-[82vw] max-[640px]:shrink-0 max-[640px]:snap-start max-[640px]:p-3 ${borderToneClass[itemMeta.tone]} ${isCurrent ? "border-[var(--gold)] bg-white/[0.09] shadow-[0_0_0_1px_rgba(255,214,107,0.65),0_14px_36px_rgba(0,0,0,0.32)]" : "border-t-2"}`}
                onClick={() => onSelectHeadline(item.id)}
              >
                <div className={`text-[10px] font-extrabold tracking-[0.2em] ${isCurrent ? "text-[var(--gold)]" : textToneClass[itemMeta.tone]}`}>
                  {isCurrent ? "NOW SHOWING" : itemMeta.label}
                </div>
                <h2 className="mt-2 mb-0 text-pretty font-[var(--serif)] text-lg leading-[1.22] max-[640px]:text-base">{item.headline}</h2>
                <div className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">{item.source}</div>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
