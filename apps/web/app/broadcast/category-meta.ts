import type { NewsCategory } from "@repo/core";

export const CATEGORY_META: Record<
  NewsCategory,
  { label: string; tone: "live" | "crypto" | "stocks"; chyron: string }
> = {
  news: { label: "TOP STORY", tone: "live", chyron: "DEVELOPING NOW" },
  crypto: { label: "CRYPTO DESK", tone: "crypto", chyron: "MARKETS LIVE" },
  stocks: { label: "MARKETS", tone: "stocks", chyron: "WALL STREET LIVE" },
};
