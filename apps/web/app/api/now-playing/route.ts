import { NextResponse } from "next/server";
import { getNowPlaying } from "@repo/core";
import { prisma } from "@repo/db";
import { createRedisConnection } from "@repo/queue";
import { optionalEnv } from "@repo/utils";

export const dynamic = "force-dynamic";

let redis: ReturnType<typeof createRedisConnection> | undefined;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const timestamp = Number(url.searchParams.get("ts"));
  const now = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp) : new Date();

  const payload = await getNowPlaying({
    prisma,
    redis: getRedis(),
    channelId: optionalEnv("CHANNEL_ID", "main"),
    now,
  });

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "no-store",
    },
  });
}

function getRedis() {
  redis ??= createRedisConnection();
  return redis;
}
