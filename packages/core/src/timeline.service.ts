import type { Redis } from "ioredis";
import type { PrismaClient } from "@repo/db";
import type { NewsCategory, NowPlayingResponse, TimelineSegment, TimelineState } from "./types";

const WINDOW_SEC = 60 * 60;
const LOOKAHEAD_COUNT = 6;
const RECENT_PLAY_TTL_SEC = 30 * 60;
const FALLBACK_STINGER: TimelineSegment = {
  audioId: "station-fallback",
  durationSec: 8,
  startedAt: 0,
  type: "stinger",
  title: "Fireside News station identification",
  category: "station",
  url: "/api/fallback-audio",
  sourceUrl: null,
};

export function timelineStartKey(channelId: string) {
  return `timeline:${channelId}:start_epoch`;
}

export function timelineSegmentsKey(channelId: string) {
  return `timeline:${channelId}:segments`;
}

export function timelinePlayedKey(channelId: string) {
  return `timeline:${channelId}:played`;
}

export async function buildRollingTimeline(input: {
  prisma: PrismaClient;
  redis: Redis;
  channelId: string;
  now?: Date;
}): Promise<TimelineState> {
  const now = input.now ?? new Date();
  const startTime = Math.floor(now.getTime() / 1_000) * 1_000;
  const recentPlayed = new Set(await input.redis.smembers(timelinePlayedKey(input.channelId)));
  const audio = await loadTimelineAudio(input.prisma, recentPlayed);
  const segments = fillTimeline(startTime, audio);

  await input.redis.set(timelineStartKey(input.channelId), String(startTime));
  await input.redis.set(timelineSegmentsKey(input.channelId), JSON.stringify(segments));

  if (segments.length > 0) {
    await input.redis.sadd(timelinePlayedKey(input.channelId), ...segments.map((segment) => segment.audioId));
    await input.redis.expire(timelinePlayedKey(input.channelId), RECENT_PLAY_TTL_SEC);
  }

  return {
    channelId: input.channelId,
    startTime,
    segments,
  };
}

export async function getNowPlaying(input: {
  prisma: PrismaClient;
  redis: Redis;
  channelId: string;
  now?: Date;
}): Promise<NowPlayingResponse> {
  const now = input.now ?? new Date();
  let state = await readTimeline(input.redis, input.channelId);

  if (!state || state.segments.length === 0 || timelineEndsBefore(state, now.getTime() + 5_000)) {
    state = await buildRollingTimeline(input);
  }

  const nowMs = now.getTime();
  const activeIndex = findActiveSegmentIndex(state.segments, nowMs);
  const segment = state.segments[activeIndex] ?? state.segments[0];
  const offsetSec = Math.max(0, Math.floor((nowMs - segment.startedAt) / 1_000));
  const remainingSec = Math.max(0, segment.durationSec - offsetSec);

  return {
    serverTime: nowMs,
    currentAudio: {
      ...segment,
      offsetSec,
      remainingSec,
    },
    nextAudio: state.segments.slice(activeIndex + 1, activeIndex + 1 + LOOKAHEAD_COUNT),
  };
}

async function readTimeline(redis: Redis, channelId: string): Promise<TimelineState | null> {
  const [startTime, segmentsJson] = await Promise.all([
    redis.get(timelineStartKey(channelId)),
    redis.get(timelineSegmentsKey(channelId)),
  ]);

  if (!startTime || !segmentsJson) {
    return null;
  }

  const segments = JSON.parse(segmentsJson) as TimelineSegment[];
  return {
    channelId,
    startTime: Number(startTime),
    segments: segments.map((segment) => ({
      ...segment,
      sourceUrl: segment.sourceUrl ?? null,
    })),
  };
}

async function loadTimelineAudio(prisma: PrismaClient, recentPlayed: Set<string>): Promise<TimelineSegment[]> {
  const rows = await prisma.audio.findMany({
    where: {
      durationSec: {
        gt: 0,
      },
    },
    orderBy: [{ type: "desc" }, { createdAt: "desc" }],
    take: 150,
    include: {
      content: {
        include: {
          article: true,
        },
      },
      bulletin: true,
    },
  });

  const playableRows = rows.filter((row) => !recentPlayed.has(row.id));
  const timelineRows = playableRows.length > 0 ? playableRows : rows;

  return timelineRows.map((row) => ({
    audioId: row.id,
    durationSec: row.durationSec,
    startedAt: 0,
    type: row.type,
    title: row.content?.headline ?? (row.type === "bulletin" ? "Hourly bulletin" : "Station update"),
    category: row.content?.article.category ?? "station",
    url: row.url,
    sourceUrl: row.content?.article.url ?? null,
  }));
}

function fillTimeline(startTime: number, candidates: TimelineSegment[]): TimelineSegment[] {
  const bulletins = candidates.filter((candidate) => candidate.type === "bulletin");
  const byCategory = groupByCategory(candidates.filter((candidate) => candidate.type === "headline"));
  const categories: NewsCategory[] = ["news", "crypto", "stocks"];
  const segments: TimelineSegment[] = [];
  const used = new Set<string>();
  let cursor = startTime;
  let categoryIndex = 0;

  while (cursor < startTime + WINDOW_SEC * 1_000) {
    const nextHour = ceilToHour(cursor);

    if (Math.abs(cursor - nextHour) < 1_000 || cursor + 30_000 >= nextHour) {
      const bulletin = nextUnused(bulletins, used);
      const segment = stampSegment(bulletin ?? FALLBACK_STINGER, cursor);
      segments.push(segment);
      used.add(segment.audioId);
      cursor += segment.durationSec * 1_000;
      continue;
    }

    const category = categories[categoryIndex % categories.length];
    const next = nextUnused(byCategory[category], used) ?? nextUnused(candidates, used) ?? FALLBACK_STINGER;
    const segment = stampSegment(next, cursor);
    segments.push(segment);
    used.add(segment.audioId);
    cursor += segment.durationSec * 1_000;
    categoryIndex += 1;
  }

  return segments;
}

function groupByCategory(candidates: TimelineSegment[]): Record<NewsCategory, TimelineSegment[]> {
  return {
    news: candidates.filter((candidate) => candidate.category === "news"),
    crypto: candidates.filter((candidate) => candidate.category === "crypto"),
    stocks: candidates.filter((candidate) => candidate.category === "stocks"),
  };
}

function nextUnused(candidates: TimelineSegment[], used: Set<string>): TimelineSegment | undefined {
  return candidates.find((candidate) => !used.has(candidate.audioId));
}

function stampSegment(segment: TimelineSegment, startedAt: number): TimelineSegment {
  return {
    ...segment,
    startedAt,
  };
}

function ceilToHour(epochMs: number): number {
  const date = new Date(epochMs);
  date.setUTCMinutes(0, 0, 0);

  if (date.getTime() < epochMs) {
    date.setUTCHours(date.getUTCHours() + 1);
  }

  return date.getTime();
}

function findActiveSegmentIndex(segments: TimelineSegment[], epochMs: number): number {
  const index = segments.findIndex((segment) => epochMs >= segment.startedAt && epochMs < segment.startedAt + segment.durationSec * 1_000);
  return index >= 0 ? index : 0;
}

function timelineEndsBefore(state: TimelineState, epochMs: number): boolean {
  const last = state.segments.at(-1);
  return !last || last.startedAt + last.durationSec * 1_000 < epochMs;
}
