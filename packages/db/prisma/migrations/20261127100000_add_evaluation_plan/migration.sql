-- CreateTable
CREATE TABLE "EvaluationPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "targetMatches" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluationPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EvaluationPlan_createdAt_idx" ON "EvaluationPlan"("createdAt");

-- Pre-registration guarantees, enforced in the database.

-- INSERT: DB clock decides createdAt; the evaluation period must begin
-- at or after registration and be well-formed.
CREATE FUNCTION evaluation_plan_before_insert() RETURNS trigger AS $$
BEGIN
  NEW."createdAt" := (clock_timestamp() AT TIME ZONE 'UTC');
  IF NEW."targetMatches" < 1 THEN
    RAISE EXCEPTION 'EvaluationPlan: targetMatches must be at least 1';
  END IF;
  IF NEW."endsAt" <= NEW."startsAt" THEN
    RAISE EXCEPTION 'EvaluationPlan: endsAt must be after startsAt';
  END IF;
  IF NEW."startsAt" < NEW."createdAt" THEN
    RAISE EXCEPTION 'EvaluationPlan: startsAt (%) is already in the past; a plan must be registered before its period begins', NEW."startsAt";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EvaluationPlan_before_insert"
  BEFORE INSERT ON "EvaluationPlan"
  FOR EACH ROW EXECUTE FUNCTION evaluation_plan_before_insert();

-- UPDATE / DELETE / TRUNCATE: never allowed.
CREATE FUNCTION evaluation_plan_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'EvaluationPlan is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "EvaluationPlan_no_update_delete"
  BEFORE UPDATE OR DELETE ON "EvaluationPlan"
  FOR EACH ROW EXECUTE FUNCTION evaluation_plan_immutable();

CREATE TRIGGER "EvaluationPlan_no_truncate"
  BEFORE TRUNCATE ON "EvaluationPlan"
  FOR EACH STATEMENT EXECUTE FUNCTION evaluation_plan_immutable();
