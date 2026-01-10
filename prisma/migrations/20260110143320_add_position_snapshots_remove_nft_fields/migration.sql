/*
  Warnings:

  - You are about to drop the column `nftCurrentValue` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `nftLastSynced` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `nftPercentRealizedPnl` on the `Market` table. All the data in the column will be lost.
  - You are about to drop the column `nftWinValue` on the `Market` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Market" DROP COLUMN "nftCurrentValue",
DROP COLUMN "nftLastSynced",
DROP COLUMN "nftPercentRealizedPnl",
DROP COLUMN "nftWinValue";

-- CreateTable
CREATE TABLE "PositionSnapshot" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "percentRealizedPnl" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "winValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PositionSnapshot_marketId_idx" ON "PositionSnapshot"("marketId");

-- CreateIndex
CREATE INDEX "PositionSnapshot_timestamp_idx" ON "PositionSnapshot"("timestamp");

-- CreateIndex
CREATE INDEX "PositionSnapshot_marketId_timestamp_idx" ON "PositionSnapshot"("marketId", "timestamp");

-- AddForeignKey
ALTER TABLE "PositionSnapshot" ADD CONSTRAINT "PositionSnapshot_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
