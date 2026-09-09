import { prisma, FixtureStatus } from "@scorelineiq/db";
import { runJob } from "../lib/job-runner";
import { generatePredictionForFixture } from "../lib/predict";

async function generatePredictions() {
  const fixtures = await prisma.fixture.findMany({
    where: {
      status: FixtureStatus.SCHEDULED,
      kickoffAt: { gte: new Date() },
    },
    select: { id: true },
  });

  let generated = 0;
  let pending = 0;
  let failed = 0;

  for (const fixture of fixtures) {
    try {
      const result = await generatePredictionForFixture(fixture.id);
      if (result.status === "generated") generated += 1;
      else pending += 1;
    } catch (error) {
      console.error(`[generate-predictions] failed for fixture ${fixture.id}:`, error);
      failed += 1;
    }
  }

  return { generated, pending, failed, total: fixtures.length };
}

async function main() {
  console.log("[generate-predictions] generating predictions for upcoming fixtures");
  const result = await generatePredictions();
  console.log(
    `[generate-predictions] done: ${result.generated} generated, ${result.pending} pending (no stats yet), ` +
      `${result.failed} failed, ${result.total} total`,
  );
}

runJob("generate-predictions", main);
