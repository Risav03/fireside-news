import type { ArticleCategory, AudioType } from "@repo/db";

export type NewsCategory = ArticleCategory;

export type IngestedArticle = {
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: NewsCategory;
};

export type ProcessedContent = {
  headline: string;
  summary: string;
  priority: number;
};

export type TimelineSegment = {
  audioId: string;
  durationSec: number;
  startedAt: number;
  type: AudioType;
  title: string;
  category: NewsCategory | "station";
  url: string;
};

export type TimelineState = {
  channelId: string;
  startTime: number;
  segments: TimelineSegment[];
};

export type NowPlayingResponse = {
  serverTime: number;
  currentAudio: TimelineSegment & {
    offsetSec: number;
    remainingSec: number;
  };
  nextAudio: TimelineSegment[];
};
