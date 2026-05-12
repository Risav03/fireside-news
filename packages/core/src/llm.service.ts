import Anthropic from "@anthropic-ai/sdk";
import type { PrismaClient } from "@repo/db";
import { clamp, requireEnv } from "@repo/utils";
import { truncateToMaxWords } from "./text";
import type { ProcessedContent } from "./types";

const MAX_SUMMARY_WORDS = 40;
const PROCESS_ARTICLE_CONCURRENCY = 3;

const ANCHOR_SYSTEM_PROMPT =
  "You are a professional news editor. Write clear, factual news copy without markdown. Headline is one concise line for on-screen display. Summary is brief prose readers skim in seconds—no bullets.";
const ANTHROPIC_MODEL = "claude-haiku-4-5";
const SUMMARY_TOOL_NAME = "record_processed_news";

const SUMMARY_TOOL = {
  name: SUMMARY_TOOL_NAME,
  description: `Return the processed news copy for a single article. Use this exactly once with a headline, a summary of at most ${MAX_SUMMARY_WORDS} words, and an importance score.`,
  input_schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["headline", "summary", "importance"],
    properties: {
      headline: { type: "string" as const },
      summary: { type: "string" as const },
      importance: { type: "integer" as const, minimum: 1, maximum: 100 },
    },
  },
};

export function createAnthropicClient() {
  return new Anthropic({
    apiKey: requireEnv("ANTHROPIC_API_KEY"),
  });
}

export async function summarizeArticle(
  anthropic: Anthropic,
  input: { title: string; content: string; source: string },
): Promise<ProcessedContent> {
  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 512,
    system: ANCHOR_SYSTEM_PROMPT,
    tools: [SUMMARY_TOOL],
    tool_choice: {
      type: "tool",
      name: SUMMARY_TOOL_NAME,
    },
    messages: [
      {
        role: "user",
        content: `Create a news headline and very brief summary for this item.\n\nTitle: ${input.title}\nSource: ${input.source}\nContent: ${input.content}\n\nHeadline: one concise line.\nSummary: plain prose, at most ${MAX_SUMMARY_WORDS} words, no bullet lists.\nImportance: integer from 1 to 100.`,
      },
    ],
  });

  const summaryToolUse = response.content.find(
    (block): block is Extract<(typeof response.content)[number], { type: "tool_use" }> =>
      block.type === "tool_use" && block.name === SUMMARY_TOOL_NAME,
  );
  const parsed = parseSummaryToolInput(summaryToolUse?.input);

  const summary = truncateToMaxWords(parsed.summary.trim(), MAX_SUMMARY_WORDS);

  return {
    headline: parsed.headline.trim(),
    summary,
    priority: clamp(parsed.importance, 1, 100),
  };
}

export async function processArticles(
  prisma: PrismaClient,
  anthropic: Anthropic,
  articleIds: string[],
  options?: { limit?: number },
): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: {
      id: {
        in: articleIds,
      },
      processedAt: null,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: options?.limit,
  });

  const contentIds: string[] = [];

  for (let i = 0; i < articles.length; i += PROCESS_ARTICLE_CONCURRENCY) {
    const batch = articles.slice(i, i + PROCESS_ARTICLE_CONCURRENCY);
    const batchContentIds = await Promise.all(batch.map((article) => processArticle(prisma, anthropic, article)));
    contentIds.push(...batchContentIds.flatMap((id) => (id ? [id] : [])));
  }

  return contentIds;
}

async function processArticle(
  prisma: PrismaClient,
  anthropic: Anthropic,
  article: { id: string; title: string; content: string; source: string },
): Promise<string | null> {
  try {
    const processed = await summarizeArticle(anthropic, article);
    const text = `${processed.headline}. ${processed.summary}`;

    const content = await prisma.content.create({
      data: {
        articleId: article.id,
        headline: processed.headline,
        summary: processed.summary,
        text,
        priority: processed.priority,
      },
    });

    await prisma.article.update({
      where: {
        id: article.id,
      },
      data: {
        processedAt: new Date(),
      },
    });

    return content.id;
  } catch (cause) {
    console.error("[process-article]", { articleId: article.id, cause });
    return null;
  }
}

function parseSummaryToolInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Anthropic summary response did not include structured tool input.");
  }

  const record = input as Record<string, unknown>;
  const { headline, summary, importance } = record;
  const normalizedImportance =
    typeof importance === "number" ? importance : typeof importance === "string" ? Number.parseFloat(importance) : Number.NaN;

  if (typeof headline !== "string" || typeof summary !== "string" || !Number.isFinite(normalizedImportance)) {
    throw new Error("Anthropic summary response had an invalid structured tool input shape.");
  }

  return {
    headline,
    summary,
    importance: Math.round(normalizedImportance),
  };
}
