-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('news', 'crypto', 'stocks');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('headline', 'summary');

-- CreateEnum
CREATE TYPE "AudioType" AS ENUM ('headline', 'bulletin', 'stinger');

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "category" "ArticleCategory" NOT NULL,
    "contentHash" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'headline',
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "bulletinCandidate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bulletin" (
    "id" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "scheduledForHour" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bulletin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audio" (
    "id" TEXT NOT NULL,
    "contentId" TEXT,
    "bulletinId" TEXT,
    "url" TEXT NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "type" "AudioType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_url_key" ON "Article"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Article_contentHash_key" ON "Article"("contentHash");

-- CreateIndex
CREATE INDEX "Article_category_publishedAt_idx" ON "Article"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_processedAt_idx" ON "Article"("processedAt");

-- CreateIndex
CREATE INDEX "Content_priority_createdAt_idx" ON "Content"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "Content_type_createdAt_idx" ON "Content"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bulletin_scheduledForHour_key" ON "Bulletin"("scheduledForHour");

-- CreateIndex
CREATE INDEX "Bulletin_scheduledForHour_idx" ON "Bulletin"("scheduledForHour");

-- CreateIndex
CREATE INDEX "Audio_type_createdAt_idx" ON "Audio"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Audio_contentId_idx" ON "Audio"("contentId");

-- CreateIndex
CREATE INDEX "Audio_bulletinId_idx" ON "Audio"("bulletinId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_bulletinId_fkey" FOREIGN KEY ("bulletinId") REFERENCES "Bulletin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
