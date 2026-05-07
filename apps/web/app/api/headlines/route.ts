import "../../env.js";
import { NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.content.findMany({
    where: {
      type: "headline",
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { article: true },
  });

  const headlines = rows.map((r) => ({
    id: r.id,
    headline: r.headline,
    summary: r.summary,
    category: r.article.category,
    priority: r.priority,
    source: r.article.source,
    sourceUrl: r.article.url,
    publishedAt: r.article.publishedAt.toISOString(),
  }));

  return NextResponse.json(
    { headlines },
    { headers: { "cache-control": "no-store" } },
  );
}
