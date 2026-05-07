import type Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "@repo/db";
import { fetchCryptoArticles, fetchNewsArticles, fetchStockArticles, storeArticles } from "./ingestion.service";
import { processArticles } from "./llm.service";

export const INGEST_GATE_MS = 15 * 60 * 1_000;

export type RefreshNewsResult = {
  skipped: boolean;
  newArticleIds: string[];
  contentIds: string[];
};

async function ingestAll(prisma: PrismaClient) {
  const [newsBatch, cryptoBatch, stocksBatch] = await Promise.all([
    fetchNewsArticles(),
    fetchCryptoArticles(),
    fetchStockArticles(),
  ]);

  const newsIds = await storeArticles(prisma, newsBatch);
  const cryptoIds = await storeArticles(prisma, cryptoBatch);
  const stockIds = await storeArticles(prisma, stocksBatch);

  const merged = [...new Set([...newsIds, ...cryptoIds, ...stockIds])];
  return merged;
}

/**
 * Fetch sources, persist new articles, run LLM processing. Gate with SyncState.lastIngestAt unless `force`.
 */
export async function refreshNews(
  prisma: PrismaClient,
  anthropic: Anthropic,
  options?: { force?: boolean },
): Promise<RefreshNewsResult> {
  const row = await prisma.syncState.findUnique({ where: { id: "default" } });

  if (!options?.force && row?.lastIngestAt) {
    const age = Date.now() - row.lastIngestAt.getTime();
    if (age >= 0 && age < INGEST_GATE_MS) {
      return { skipped: true, newArticleIds: [], contentIds: [] };
    }
  }

  const newArticleIds = await ingestAll(prisma);
  const contentIds = newArticleIds.length > 0 ? await processArticles(prisma, anthropic, newArticleIds) : [];

  await prisma.syncState.upsert({
    where: { id: "default" },
    create: { id: "default", lastIngestAt: new Date() },
    update: { lastIngestAt: new Date() },
  });

  return { skipped: false, newArticleIds, contentIds };
}
