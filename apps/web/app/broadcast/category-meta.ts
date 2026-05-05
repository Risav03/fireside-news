import type { TimelineSegment } from "@repo/core";

export const CATEGORY_META: Record<
  TimelineSegment["category"],
  { label: string; tone: "live" | "crypto" | "stocks"; chyron: string }
> = {
  news: { label: "TOP STORY", tone: "live", chyron: "DEVELOPING NOW" },
  crypto: { label: "CRYPTO DESK", tone: "crypto", chyron: "MARKETS LIVE" },
  stocks: { label: "MARKETS", tone: "stocks", chyron: "WALL STREET LIVE" },
  station: { label: "BULLETIN", tone: "live", chyron: "TOP OF THE HOUR" },
};
