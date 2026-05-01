import OpenAI from "openai";
import type { PrismaClient } from "@repo/db";
import { clamp, requireEnv } from "@repo/utils";
import { estimateSpokenDurationSec } from "./text";
import type { ProcessedContent } from "./types";

const ANCHOR_SYSTEM_PROMPT =
  "You are a professional news anchor. Speak clearly, concisely, and formally. Write short audio-ready copy without markdown.";

export function createOpenAIClient() {
  return new OpenAI({
    apiKey: requireEnv("OPENAI_API_KEY"),
  });
}

export async function summarizeArticle(openai: OpenAI, input: { title: string; content: string; source: string }): Promise<ProcessedContent> {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: ANCHOR_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Create an audio news headline and short summary for this item.\n\nTitle: ${input.title}\nSource: ${input.source}\nContent: ${input.content}\n\nReturn strict JSON with keys: headline, summary, importance. Importance is an integer from 1 to 100. The headline plus summary must be speakable in 5 to 20 seconds.`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "processed_news",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["headline", "summary", "importance"],
          properties: {
            headline: { type: "string" },
            summary: { type: "string" },
            importance: { type: "integer", minimum: 1, maximum: 100 },
          },
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as {
    headline: string;
    summary: string;
    importance: number;
  };

  return {
    headline: parsed.headline.trim(),
    summary: parsed.summary.trim(),
    priority: clamp(parsed.importance, 1, 100),
  };
}

export async function processArticles(prisma: PrismaClient, openai: OpenAI, articleIds: string[]): Promise<string[]> {
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
  });

  const contentIds: string[] = [];

  for (const article of articles) {
    const processed = await summarizeArticle(openai, article);
    const text = `${processed.headline}. ${processed.summary}`;
    const durationSec = estimateSpokenDurationSec(text);

    const content = await prisma.content.create({
      data: {
        articleId: article.id,
        headline: processed.headline,
        summary: processed.summary,
        text,
        priority: processed.priority,
        bulletinCandidate: processed.priority >= 35 && durationSec <= 30,
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

    contentIds.push(content.id);
  }

  return contentIds;
}

export async function generateBulletinScript(prisma: PrismaClient, openai: OpenAI, scheduledForHour = new Date()): Promise<string> {
  const content = await prisma.content.findMany({
    where: {
      bulletinCandidate: true,
      createdAt: {
        gte: new Date(Date.now() - 6 * 60 * 60 * 1_000),
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 10,
    include: {
      article: true,
    },
  });

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: ANCHOR_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Generate a concise hourly AI news radio bulletin for ${scheduledForHour.toISOString()}.\n\nFormat: Intro, Headlines, Summaries, Outro. Keep it around 8 to 10 minutes if enough stories exist; otherwise keep it concise and complete.\n\nItems:\n${content
          .map((item, index) => `${index + 1}. [${item.article.category}] ${item.headline} - ${item.summary}`)
          .join("\n")}`,
      },
    ],
  });

  return response.output_text.trim();
}
