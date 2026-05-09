"use client";

import { CATEGORY_META } from "../category-meta";
import type { HeadlineRow } from "../use-headlines";

const cardToneClass = {
  live: "bg-[radial-gradient(ellipse_at_15%_0%,rgba(200,30,30,0.16),transparent_48%),radial-gradient(ellipse_at_100%_100%,rgba(46,125,255,0.12),transparent_45%),linear-gradient(180deg,rgba(21,23,31,0.96),rgba(8,9,14,0.98))]",
  crypto: "bg-[radial-gradient(ellipse_at_15%_0%,rgba(247,147,26,0.18),transparent_48%),linear-gradient(180deg,rgba(21,23,31,0.96),rgba(8,9,14,0.98))]",
  stocks: "bg-[radial-gradient(ellipse_at_15%_0%,rgba(46,125,255,0.18),transparent_48%),linear-gradient(180deg,rgba(21,23,31,0.96),rgba(8,9,14,0.98))]",
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
}: {
  headline: HeadlineRow | null;
  queue: HeadlineRow[];
  progress: number;
  lastUpdatedAt: Date | null;
  onRefreshPress: () => void;
}) {
  const category = headline?.category as keyof typeof CATEGORY_META | undefined;
  const meta = category ? (CATEGORY_META[category] ?? CATEGORY_META.news) : CATEGORY_META.news;
  const publishedAt = headline?.publishedAt ? new Date(headline.publishedAt) : null;

  return (
    <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 max-[960px]:gap-2.5" aria-label="News cards">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--line)] border-l-4 border-l-[var(--brand)] bg-[linear-gradient(180deg,#15171f,#0c0e14)] px-4 py-3">
        <div>
          <div className="font-[var(--display)] text-[22px] font-bold tracking-[0.12em]">FIRESIDE NEWS</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--mute)]">
            {lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Loading latest cards"}
          </div>
        </div>
        <button
          type="button"
          className="cursor-pointer appearance-none rounded-full border border-white/15 bg-white/5 px-4 py-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--ink)] hover:bg-white/10"
          onClick={onRefreshPress}
        >
          Refresh
        </button>
      </div>

      <article
        className={`relative grid min-h-[420px] content-center gap-[22px] overflow-hidden rounded-[18px] border border-[var(--line)] p-[clamp(28px,5vw,72px)] shadow-[0_28px_80px_rgba(0,0,0,0.35)] max-[960px]:min-h-[46vh] max-[960px]:p-7 ${cardToneClass[meta.tone]}`}
      >
        <div className="absolute inset-x-0 top-0 h-[5px] bg-white/10" aria-hidden>
          <div className="h-full bg-[linear-gradient(90deg,var(--gold),#FF7A1A,var(--brand))] transition-[width] duration-[600ms] ease-linear" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[var(--mute)]">
          <span className="text-[var(--gold)]">{meta.label}</span>
          {headline ? <span>{headline.source}</span> : null}
          {publishedAt && !Number.isNaN(publishedAt.getTime()) ? (
            <span>{publishedAt.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          ) : null}
        </div>

        <h1 className="m-0 max-w-[18ch] text-balance font-[var(--serif)] text-[clamp(38px,6.2vw,86px)] leading-[0.98] font-semibold tracking-[-0.04em] max-[960px]:max-w-none">
          {headline?.headline ?? "Fetching the latest briefing..."}
        </h1>
        {headline ? <p className="m-0 max-w-[68ch] text-pretty text-[clamp(18px,2.2vw,30px)] leading-[1.35] text-white/85">{headline.summary}</p> : null}

        <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 pt-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[var(--mute)]">
          <span>{meta.chyron}</span>
          {headline?.sourceUrl ? (
            <a className="text-[var(--gold)] no-underline hover:underline" href={headline.sourceUrl} target="_blank" rel="noopener noreferrer">
              Read source
            </a>
          ) : null}
        </div>
      </article>

      {queue.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 max-[960px]:grid-cols-1" aria-label="Upcoming cards">
          {queue.slice(1, 5).map((item) => {
            const itemMeta = CATEGORY_META[item.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.news;
            return (
              <article
                key={item.id}
                className={`min-h-[138px] rounded-[10px] border border-[var(--line)] border-t-[3px] bg-white/[0.035] p-4 ${borderToneClass[itemMeta.tone]}`}
              >
                <div className={`text-[10px] font-extrabold tracking-[0.2em] ${textToneClass[itemMeta.tone]}`}>{itemMeta.label}</div>
                <h2 className="mt-2 mb-0 text-pretty font-[var(--serif)] text-lg leading-[1.22]">{item.headline}</h2>
                <div className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mute)]">{item.source}</div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
