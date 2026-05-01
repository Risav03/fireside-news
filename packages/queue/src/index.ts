import { Queue, QueueEvents, type JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { requireEnv } from "@repo/utils";

export const QUEUE_NAMES = {
  ingestion: "ingestion",
  processing: "processing",
  media: "media",
  timeline: "timeline",
} as const;

export const JOB_NAMES = {
  fetchNews: "fetch-news",
  fetchCrypto: "fetch-crypto",
  fetchStocks: "fetch-stocks",
  processNews: "process-news",
  generateAudio: "generate-audio",
  generateBulletin: "generate-bulletin",
  rebuildTimeline: "rebuild-timeline",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export type ProcessNewsJob = {
  articleIds: string[];
};

export type GenerateAudioJob =
  | {
      contentId: string;
      bulletinId?: never;
      type: "headline";
    }
  | {
      bulletinId: string;
      contentId?: never;
      type: "bulletin";
    };

export type RebuildTimelineJob = {
  channelId: string;
};

export function createRedisConnection(options?: { blocking?: boolean }) {
  return new IORedis(requireEnv("REDIS_URL"), {
    maxRetriesPerRequest: options?.blocking ? null : 3,
  });
}

export function createQueue(name: QueueName): Queue {
  return new Queue(name, {
    connection: createRedisConnection(),
    defaultJobOptions: defaultJobOptions(),
  });
}

export function createQueueEvents(name: QueueName): QueueEvents {
  return new QueueEvents(name, {
    connection: createRedisConnection({ blocking: true }),
  });
}

export function defaultJobOptions(): JobsOptions {
  return {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5_000,
    },
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 1_000,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7,
    },
  };
}

export function createQueues() {
  return {
    ingestion: createQueue(QUEUE_NAMES.ingestion),
    processing: createQueue(QUEUE_NAMES.processing),
    media: createQueue(QUEUE_NAMES.media),
    timeline: createQueue(QUEUE_NAMES.timeline),
  };
}

export async function closeQueues(queues: ReturnType<typeof createQueues>) {
  await Promise.all(Object.values(queues).map((queue) => queue.close()));
}

export async function registerSchedulers(queues: ReturnType<typeof createQueues>, channelId: string) {
  await queues.ingestion.upsertJobScheduler(
    JOB_NAMES.fetchNews,
    { every: 10 * 60 * 1_000 },
    { name: JOB_NAMES.fetchNews, data: {}, opts: defaultJobOptions() },
  );

  await queues.ingestion.upsertJobScheduler(
    JOB_NAMES.fetchCrypto,
    { every: 10 * 60 * 1_000 },
    { name: JOB_NAMES.fetchCrypto, data: {}, opts: defaultJobOptions() },
  );

  await queues.ingestion.upsertJobScheduler(
    JOB_NAMES.fetchStocks,
    { every: 10 * 60 * 1_000 },
    { name: JOB_NAMES.fetchStocks, data: {}, opts: defaultJobOptions() },
  );

  await queues.processing.upsertJobScheduler(
    JOB_NAMES.generateBulletin,
    { pattern: "0 0 * * * *" },
    { name: JOB_NAMES.generateBulletin, data: {}, opts: defaultJobOptions() },
  );

  await queues.timeline.upsertJobScheduler(
    JOB_NAMES.rebuildTimeline,
    { every: 3 * 60 * 1_000 },
    {
      name: JOB_NAMES.rebuildTimeline,
      data: { channelId } satisfies RebuildTimelineJob,
      opts: defaultJobOptions(),
    },
  );
}
