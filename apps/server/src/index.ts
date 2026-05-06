import "./env.js";
import { Worker } from "bullmq";
import { prisma } from "@repo/db";
import {
  buildRollingTimeline,
  createAnthropicClient,
  estimateSpokenDurationSec,
  fetchCryptoArticles,
  fetchNewsArticles,
  fetchStockArticles,
  generateAudioForBulletin,
  generateAudioForContent,
  generateBulletinScript,
  processArticles,
  storeArticles,
} from "@repo/core";
import {
  createQueues,
  createQueueEvents,
  createRedisConnection,
  JOB_NAMES,
  QUEUE_NAMES,
  registerSchedulers,
  type GenerateAudioJob,
  type ProcessNewsJob,
  type RebuildTimelineJob,
} from "@repo/queue";
import { optionalEnv } from "@repo/utils";

const channelId = optionalEnv("CHANNEL_ID", "main");
/** BullMQ default lock is 30s; LLM + multi-chunk TTS jobs exceed that and appear as "stalled". */
const PROCESSING_LOCK_MS = 15 * 60 * 1_000;
const MEDIA_LOCK_MS = 30 * 60 * 1_000;
const STANDARD_LOCK_MS = 5 * 60 * 1_000;

const queues = createQueues();
const anthropic = createAnthropicClient();
const timelineRedis = createRedisConnection();

timelineRedis.on("error", (error) => {
  console.error(`[timeline] redis connection error: ${formatError(error)}`);
});

await registerSchedulers(queues, channelId);

const ingestionWorker = new Worker(
  QUEUE_NAMES.ingestion,
  async (job) => {
    if (job.name === JOB_NAMES.fetchNews) {
      return ingestAndQueue(await fetchNewsArticles());
    }

    if (job.name === JOB_NAMES.fetchCrypto) {
      return ingestAndQueue(await fetchCryptoArticles());
    }

    if (job.name === JOB_NAMES.fetchStocks) {
      return ingestAndQueue(await fetchStockArticles());
    }

    throw new Error(`Unknown ingestion job: ${job.name}`);
  },
  {
    connection: createRedisConnection({ blocking: true }),
    concurrency: 2,
    lockDuration: STANDARD_LOCK_MS,
    stalledInterval: 60_000,
    maxStalledCount: 5,
  },
);

const processingWorker = new Worker(
  QUEUE_NAMES.processing,
  async (job) => {
    if (job.name === JOB_NAMES.processNews) {
      const data = job.data as ProcessNewsJob;
      const contentIds = await processArticles(prisma, anthropic, data.articleIds);

      await Promise.all(
        contentIds.map((contentId) =>
          queues.media.add(JOB_NAMES.generateAudio, {
            contentId,
            type: "headline",
          } satisfies GenerateAudioJob),
        ),
      );

      return { contentIds };
    }

    if (job.name === JOB_NAMES.generateBulletin) {
      const scheduledForHour = currentHour();
      const script = await generateBulletinScript(prisma, anthropic, scheduledForHour);
      const bulletin = await prisma.bulletin.upsert({
        where: {
          scheduledForHour,
        },
        update: {
          script,
          durationSec: estimateSpokenDurationSec(script),
        },
        create: {
          script,
          durationSec: estimateSpokenDurationSec(script),
          scheduledForHour,
        },
      });

      await queues.media.add(JOB_NAMES.generateAudio, {
        bulletinId: bulletin.id,
        type: "bulletin",
      } satisfies GenerateAudioJob);

      return { bulletinId: bulletin.id };
    }

    throw new Error(`Unknown processing job: ${job.name}`);
  },
  {
    connection: createRedisConnection({ blocking: true }),
    concurrency: 2,
    lockDuration: PROCESSING_LOCK_MS,
    stalledInterval: 60_000,
    maxStalledCount: 5,
  },
);

const mediaWorker = new Worker(
  QUEUE_NAMES.media,
  async (job) => {
    if (job.name !== JOB_NAMES.generateAudio) {
      throw new Error(`Unknown media job: ${job.name}`);
    }

    const data = job.data as GenerateAudioJob;

    if (data.type === "headline") {
      return { audioId: await generateAudioForContent(prisma, data.contentId) };
    }

    return { audioId: await generateAudioForBulletin(prisma, data.bulletinId) };
  },
  {
    connection: createRedisConnection({ blocking: true }),
    concurrency: 1,
    lockDuration: MEDIA_LOCK_MS,
    stalledInterval: 60_000,
    maxStalledCount: 5,
  },
);

const timelineWorker = new Worker(
  QUEUE_NAMES.timeline,
  async (job) => {
    if (job.name !== JOB_NAMES.rebuildTimeline) {
      throw new Error(`Unknown timeline job: ${job.name}`);
    }

    const data = job.data as RebuildTimelineJob;
    return buildRollingTimeline({
      prisma,
      redis: timelineRedis,
      channelId: data.channelId,
    });
  },
  {
    connection: createRedisConnection({ blocking: true }),
    concurrency: 1,
    lockDuration: STANDARD_LOCK_MS,
    stalledInterval: 60_000,
    maxStalledCount: 5,
  },
);

const workers = [
  [QUEUE_NAMES.ingestion, ingestionWorker],
  [QUEUE_NAMES.processing, processingWorker],
  [QUEUE_NAMES.media, mediaWorker],
  [QUEUE_NAMES.timeline, timelineWorker],
] as const;

for (const [queueName, worker] of workers) {
  worker.on("error", (error) => {
    console.error(`[${queueName}] worker error: ${formatError(error)}`);
  });
}

for (const [queueName, queue] of Object.entries(queues)) {
  queue.on("error", (error) => {
    console.error(`[${queueName}] queue error: ${formatError(error)}`);
  });
}

const events = Object.values(QUEUE_NAMES).map((queueName) => {
  const queueEvents = createQueueEvents(queueName);

  queueEvents.on("error", (error) => {
    console.error(`[${queueName}] queue events error: ${formatError(error)}`);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(`[${queueName}] job ${jobId} failed: ${failedReason}`);
  });

  queueEvents.on("completed", ({ jobId }) => {
    console.log(`[${queueName}] job ${jobId} completed`);
  });

  return queueEvents;
});

console.log(`AI news radio worker started for channel "${channelId}".`);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function ingestAndQueue(articles: Awaited<ReturnType<typeof fetchNewsArticles>>) {
  const articleIds = await storeArticles(prisma, articles);

  if (articleIds.length > 0) {
    await queues.processing.add(JOB_NAMES.processNews, {
      articleIds,
    } satisfies ProcessNewsJob);
  }

  return { articleIds };
}

function currentHour() {
  const date = new Date();
  date.setUTCMinutes(0, 0, 0);
  return date;
}

function formatError(error: unknown) {
  return error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
}

async function shutdown() {
  console.log("Shutting down AI news radio worker...");
  await Promise.all([
    ingestionWorker.close(),
    processingWorker.close(),
    mediaWorker.close(),
    timelineWorker.close(),
    ...events.map((event) => event.close()),
    ...Object.values(queues).map((queue) => queue.close()),
    timelineRedis.quit(),
    prisma.$disconnect(),
  ]);
  process.exit(0);
}
