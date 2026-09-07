-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "draw" INTEGER,
ADD COLUMN     "form" TEXT,
ADD COLUMN     "goalsAgainst" INTEGER,
ADD COLUMN     "goalsFor" INTEGER,
ADD COLUMN     "lost" INTEGER,
ADD COLUMN     "played" INTEGER,
ADD COLUMN     "points" INTEGER,
ADD COLUMN     "standingsUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "won" INTEGER;
