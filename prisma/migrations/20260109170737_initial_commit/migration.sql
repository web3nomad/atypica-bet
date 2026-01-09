-- CreateTable
CREATE TABLE "Market" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "closeDate" TIMESTAMP(3) NOT NULL,
    "resolveDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "atypicaPickId" TEXT,
    "atypicaAnalysis" TEXT,
    "atypicaAnalysisUrl" TEXT,
    "accuracyScore" DOUBLE PRECISION,
    "externalSource" TEXT,
    "externalData" JSONB,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "poolAmount" DOUBLE PRECISION,
    "poolCurrency" TEXT DEFAULT 'USD',
    "nftPercentRealizedPnl" DOUBLE PRECISION,
    "nftCurrentValue" DOUBLE PRECISION,
    "nftWinValue" DOUBLE PRECISION,
    "nftLastSynced" TIMESTAMP(3),

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "externalProb" DOUBLE PRECISION,
    "atypicaProb" DOUBLE PRECISION,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Market_status_idx" ON "Market"("status");

-- CreateIndex
CREATE INDEX "Market_category_idx" ON "Market"("category");

-- CreateIndex
CREATE INDEX "Market_closeDate_idx" ON "Market"("closeDate");

-- CreateIndex
CREATE INDEX "Option_marketId_idx" ON "Option"("marketId");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
