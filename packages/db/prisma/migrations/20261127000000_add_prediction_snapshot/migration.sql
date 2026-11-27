-- CreateTable
CREATE TABLE "PredictionSnapshot" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "homeWinProbability" DOUBLE PRECISION NOT NULL,
    "drawProbability" DOUBLE PRECISION NOT NULL,
    "awayWinProbability" DOUBLE PRECISION NOT NULL,
    "predictedScoreHome" INTEGER NOT NULL,
    "predictedScoreAway" INTEGER NOT NULL,
    "over25Probability" DOUBLE PRECISION NOT NULL,
    "bttsProbability" DOUBLE PRECISION NOT NULL,
    "expectedGoals" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "kickoffAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PredictionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PredictionSnapshot_fixtureId_createdAt_idx" ON "PredictionSnapshot"("fixtureId", "createdAt");

-- CreateIndex
CREATE INDEX "PredictionSnapshot_createdAt_idx" ON "PredictionSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "PredictionSnapshot" ADD CONSTRAINT "PredictionSnapshot_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Immutability + pre-kickoff guarantees, enforced in the database so no
-- application bug, admin tool or ad-hoc script can rewrite the record.

-- INSERT: take the authoritative clock and kickoff time from the DB,
-- and refuse anything recorded at or after kickoff.
CREATE FUNCTION prediction_snapshot_before_insert() RETURNS trigger AS $$
DECLARE
  fixture_kickoff TIMESTAMP(3);
BEGIN
  SELECT "kickoffAt" INTO fixture_kickoff FROM "Fixture" WHERE "id" = NEW."fixtureId";
  IF fixture_kickoff IS NULL THEN
    RAISE EXCEPTION 'PredictionSnapshot: fixture % not found', NEW."fixtureId";
  END IF;
  NEW."kickoffAt" := fixture_kickoff;
  -- Fixture.kickoffAt is stored as UTC wall-clock time (Prisma convention).
  NEW."createdAt" := (clock_timestamp() AT TIME ZONE 'UTC');
  IF NEW."createdAt" >= NEW."kickoffAt" THEN
    RAISE EXCEPTION 'PredictionSnapshot: kickoff has passed for fixture %; snapshots are locked', NEW."fixtureId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PredictionSnapshot_before_insert"
  BEFORE INSERT ON "PredictionSnapshot"
  FOR EACH ROW EXECUTE FUNCTION prediction_snapshot_before_insert();

-- UPDATE / DELETE: never allowed.
CREATE FUNCTION prediction_snapshot_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PredictionSnapshot is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PredictionSnapshot_no_update_delete"
  BEFORE UPDATE OR DELETE ON "PredictionSnapshot"
  FOR EACH ROW EXECUTE FUNCTION prediction_snapshot_immutable();

CREATE TRIGGER "PredictionSnapshot_no_truncate"
  BEFORE TRUNCATE ON "PredictionSnapshot"
  FOR EACH STATEMENT EXECUTE FUNCTION prediction_snapshot_immutable();
