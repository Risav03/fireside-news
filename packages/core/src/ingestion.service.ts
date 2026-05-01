import type { PrismaClient } from "@repo/db";
import { optionalEnv, requireEnv } from "@repo/utils";
import { contentHash } from "./text";
import type { IngestedArticle } from "./types";

type NewsApiArticle = {
  title?: string;
  description?: string;
  content?: string;
  url?: string;
  publishedAt?: string;
  source?: {
    name?: string;
  };
};

type AlphaVantageNewsArticle = {
  title?: string;
  summary?: string;
  url?: string;
  time_published?: string;
  source?: string;
};

export async function fetchNewsArticles(): Promise<IngestedArticle[]> {
  const apiKey = optionalEnv("NEWS_API_KEY");

  if (!apiKey) {
    return [];
  }

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("category", "technology");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NewsAPI request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { articles?: NewsApiArticle[] };

  return (payload.articles ?? [])
    .filter((article) => article.title && article.url)
    .map((article) => ({
      title: article.title ?? "",
      content: article.content ?? article.description ?? article.title ?? "",
      source: article.source?.name ?? "NewsAPI",
      url: article.url ?? "",
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      category: "news",
    }));
}

export async function fetchCryptoArticles(): Promise<IngestedArticle[]> {
  const response = await fetch("https://api.coingecko.com/api/v3/search/trending");

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    coins?: Array<{
      item?: {
        name?: string;
        symbol?: string;
        market_cap_rank?: number;
        data?: {
          price?: string;
          price_change_percentage_24h?: Record<string, number>;
        };
      };
    }>;
  };

  return (payload.coins ?? []).slice(0, 10).flatMap(({ item }) => {
    if (!item?.name || !item.symbol) {
      return [];
    }

    const change = item.data?.price_change_percentage_24h?.usd;
    const direction = typeof change === "number" && change >= 0 ? "up" : "down";
    const changeText = typeof change === "number" ? `${Math.abs(change).toFixed(2)} percent ${direction}` : "moving";
    const title = `${item.name} trends on CoinGecko`;

    return [
      {
        title,
        content: `${item.name} (${item.symbol.toUpperCase()}) is ${changeText} over 24 hours. Market cap rank is ${item.market_cap_rank ?? "unranked"}.`,
        source: "CoinGecko",
        url: `https://www.coingecko.com/en/coins/${item.name.toLowerCase().replace(/\s+/g, "-")}`,
        publishedAt: new Date(),
        category: "crypto" as const,
      },
    ];
  });
}

export async function fetchStockArticles(): Promise<IngestedArticle[]> {
  const apiKey = optionalEnv("ALPHA_VANTAGE_API_KEY");

  if (!apiKey) {
    return [];
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "NEWS_SENTIMENT");
  url.searchParams.set("topics", "technology");
  url.searchParams.set("limit", "20");
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alpha Vantage request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as { feed?: AlphaVantageNewsArticle[] };

  return (payload.feed ?? [])
    .filter((article) => article.title && article.url)
    .map((article) => ({
      title: article.title ?? "",
      content: article.summary ?? article.title ?? "",
      source: article.source ?? "Alpha Vantage",
      url: article.url ?? "",
      publishedAt: parseAlphaVantageDate(article.time_published),
      category: "stocks",
    }));
}

export async function storeArticles(prisma: PrismaClient, articles: IngestedArticle[]): Promise<string[]> {
  const ids: string[] = [];

  for (const article of articles) {
    const stored = await prisma.article.upsert({
      where: {
        contentHash: contentHash(article),
      },
      update: {
        title: article.title,
        content: article.content,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        category: article.category,
      },
      create: {
        ...article,
        contentHash: contentHash(article),
      },
    });

    if (!stored.processedAt) {
      ids.push(stored.id);
    }
  }

  return ids;
}

function parseAlphaVantageDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);

  if (!match) {
    return new Date(value);
  }

  const [, year, month, day, hour, minute, second] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
}

export function assertIngestionConfigured() {
  requireEnv("DATABASE_URL");
  requireEnv("REDIS_URL");
}
