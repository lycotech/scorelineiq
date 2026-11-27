import { createHash } from "node:crypto";
import { Prisma } from "@scorelineiq/db";

// The fields that define "what we predicted". Shared by the live
// Prediction row and the append-only PredictionSnapshot so the two can
// never drift apart.
export interface PredictionContent {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedScoreHome: number;
  predictedScoreAway: number;
  over25Probability: number;
  bttsProbability: number;
  expectedGoals: number | null;
  confidence: number;
  modelVersion: string;
}

export class KickoffPassedError extends Error {
  constructor() {
    super("Kickoff has passed — predictions are locked and can no longer be changed");
    this.name = "KickoffPassedError";
  }
}

export function hashPredictionContent(c: PredictionContent): string {
  // Fixed key order so the hash is stable across code changes.
  const canonical = JSON.stringify([
    c.homeWinProbability,
    c.drawProbability,
    c.awayWinProbability,
    c.predictedScoreHome,
    c.predictedScoreAway,
    c.over25Probability,
    c.bttsProbability,
    c.expectedGoals,
    c.confidence,
    c.modelVersion,
  ]);
  return createHash("sha256").update(canonical).digest("hex");
}

// Saves the live prediction AND appends a snapshot in ONE transaction,
// so the public history can never disagree with what the site showed.
//
// - Refuses (KickoffPassedError) once kickoff has passed: after that the
//   prediction is locked, live row included. The DB trigger enforces the
//   same rule for snapshots using its own clock.
// - Idempotent: if the newest snapshot has identical content, nothing is
//   appended, so re-running a job never creates duplicate rows.
export async function savePredictionWithSnapshot(
  tx: Prisma.TransactionClient,
  fixtureId: string,
  content: PredictionContent,
): Promise<{ snapshotCreated: boolean }> {
  const fixture = await tx.fixture.findUniqueOrThrow({
    where: { id: fixtureId },
    select: { kickoffAt: true },
  });
  if (fixture.kickoffAt.getTime() <= Date.now()) throw new KickoffPassedError();

  await tx.prediction.upsert({
    where: { fixtureId },
    create: { fixtureId, ...content },
    update: { ...content, generatedAt: new Date() },
  });

  const contentHash = hashPredictionContent(content);
  const latest = await tx.predictionSnapshot.findFirst({
    where: { fixtureId },
    orderBy: { createdAt: "desc" },
    select: { contentHash: true },
  });
  if (latest?.contentHash === contentHash) return { snapshotCreated: false };

  await tx.predictionSnapshot.create({
    // kickoffAt/createdAt are overwritten by the DB trigger; kickoffAt is
    // required by the schema so we pass the value we just read.
    data: { fixtureId, ...content, contentHash, kickoffAt: fixture.kickoffAt },
  });
  return { snapshotCreated: true };
}
