-- DropForeignKey
ALTER TABLE "AccuracyStat" DROP CONSTRAINT "AccuracyStat_leagueId_fkey";

-- DropIndex
DROP INDEX "AccuracyStat_leagueId_idx";

-- DropIndex
DROP INDEX "AccuracyStat_market_windowLabel_idx";

-- AlterTable
ALTER TABLE "AccuracyStat" ALTER COLUMN "leagueId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AccuracyStat_leagueId_market_windowLabel_key" ON "AccuracyStat"("leagueId", "market", "windowLabel");

-- AddForeignKey
ALTER TABLE "AccuracyStat" ADD CONSTRAINT "AccuracyStat_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
