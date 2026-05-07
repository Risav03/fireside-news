-- Drop dependent tables first
DROP TABLE IF EXISTS "Audio";

DROP TABLE IF EXISTS "Bulletin";

-- DropEnum only if exists - Postgres: DROP TYPE
DROP TYPE IF EXISTS "AudioType";

ALTER TABLE "Content" DROP COLUMN IF EXISTS "bulletinCandidate";

CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "lastIngestAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

INSERT INTO "SyncState" ("id", "lastIngestAt", "updatedAt")
VALUES ('default', NULL, CURRENT_TIMESTAMP);
