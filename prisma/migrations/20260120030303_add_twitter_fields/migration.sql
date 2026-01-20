-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('BUY', 'SELL', 'REVENUE', 'ANALYSIS');

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "atypicaPodcastUrl" TEXT;

-- CreateTable
CREATE TABLE "TwitterAccount" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "twitterUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwitterAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "marketId" TEXT,
    "tweetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "type" "PostType",
    "rawJson" JSONB,
    "mediaUrls" TEXT[],
    "outLinks" TEXT[],
    "likeCount" INTEGER,
    "replyCount" INTEGER,
    "retweetCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TwitterAccount_handle_key" ON "TwitterAccount"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "TwitterAccount_twitterUserId_key" ON "TwitterAccount"("twitterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Tweet_tweetId_key" ON "Tweet"("tweetId");

-- CreateIndex
CREATE INDEX "Tweet_accountId_idx" ON "Tweet"("accountId");

-- CreateIndex
CREATE INDEX "Tweet_marketId_idx" ON "Tweet"("marketId");

-- CreateIndex
CREATE INDEX "Tweet_type_postedAt_idx" ON "Tweet"("type", "postedAt");

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TwitterAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;
