-- CreateTable
CREATE TABLE "CoverageDay" (
    "id" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "providerFinished" INTEGER NOT NULL,
    "missingFromDb" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverageDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoverageDay_day_key" ON "CoverageDay"("day");
