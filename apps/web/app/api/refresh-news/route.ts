import "../../env.js";
import { createAnthropicClient, refreshNews } from "@repo/core";
import { prisma } from "@repo/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
/** LLM throughput for batches can exceed default function limits on serverless hosts. */
export const maxDuration = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";

  try {
    const anthropic = createAnthropicClient();
    const result = await refreshNews(prisma, anthropic, { force });
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Refresh failed.";
    console.error("[refresh-news]", cause);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
