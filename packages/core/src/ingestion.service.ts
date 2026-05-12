import type { PrismaClient } from "@repo/db";
import { requireEnv } from "@repo/utils";
import { contentHash } from "./text";
import type { IngestedArticle } from "./types";

type RssFeed = {
  url: string;
  source: string;
};

const CRYPTO_NEWS_FEEDS: RssFeed[] = [
  { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { source: "Cointelegraph", url: "https://cointelegraph.com/rss" },
];

const NEWS_ARTICLE_LIMIT = 30;

export async function fetchNewsArticles(): Promise<IngestedArticle[]> {
  const feedResults = await Promise.allSettled(CRYPTO_NEWS_FEEDS.map(fetchRssFeed));
  const articles = feedResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  return dedupeByUrl(articles)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, NEWS_ARTICLE_LIMIT);
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

export function assertIngestionConfigured() {
  requireEnv("DATABASE_URL");
}

async function fetchRssFeed(feed: RssFeed): Promise<IngestedArticle[]> {
  const response = await fetch(feed.url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`${feed.source} RSS request failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  return parseRssItems(xml).flatMap((item) => {
    if (!item.title || !item.url) {
      return [];
    }

    return [
      {
        title: item.title,
        content: item.description || item.title,
        source: feed.source,
        url: item.url,
        publishedAt: item.publishedAt,
        category: "crypto" as const,
      },
    ];
  });
}

function parseRssItems(xml: string) {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches.map((itemXml) => ({
    title: cleanXmlText(getTagText(itemXml, "title")),
    description: cleanXmlText(getTagText(itemXml, "description") || getTagText(itemXml, "content:encoded")),
    url: cleanXmlText(getTagText(itemXml, "link") || getTagText(itemXml, "guid")),
    publishedAt: parseDate(cleanXmlText(getTagText(itemXml, "pubDate") || getTagText(itemXml, "updated"))),
  }));
}

function getTagText(xml: string, tagName: string) {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<${escapedTagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTagName}>`, "i"));
  return match?.[1] ?? "";
}

function cleanXmlText(value: string) {
  return decodeXmlEntities(
    value
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseDate(value: string) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function dedupeByUrl(articles: IngestedArticle[]) {
  const seen = new Set<string>();
  const deduped: IngestedArticle[] = [];

  for (const article of articles) {
    if (seen.has(article.url)) {
      continue;
    }

    seen.add(article.url);
    deduped.push(article);
  }

  return deduped;
}
