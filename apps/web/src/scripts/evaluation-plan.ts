// CLI for pre-registering the public evaluation period. Run by hand:
//
//   npm run evaluation-plan --workspace=web -- create "<name>" <startDate> <endDate> <targetMatches>
//   npm run evaluation-plan --workspace=web -- list
//
// Dates are YYYY-MM-DD, interpreted as 00:00 UTC. The database refuses a
// plan whose start is already in the past, and plans can never be edited
// or deleted — so check the numbers before running `create`.
import { prisma } from "@scorelineiq/db";
import { parseDateParam } from "../lib/format";

function usageAndExit(): never {
  console.error(
    "Usage:\n" +
      '  npm run evaluation-plan --workspace=web -- create "<name>" <startDate> <endDate> <targetMatches>\n' +
      "  npm run evaluation-plan --workspace=web -- list",
  );
  process.exit(1);
}

async function create(name: string, startRaw: string, endRaw: string, targetRaw: string) {
  const startsAt = parseDateParam(startRaw);
  const endsAt = parseDateParam(endRaw);
  const targetMatches = Number(targetRaw);
  if (!name.trim() || !startsAt || !endsAt || !Number.isInteger(targetMatches) || targetMatches < 1) usageAndExit();

  const plan = await prisma.evaluationPlan.create({
    data: { name: name.trim(), startsAt, endsAt, targetMatches },
  });
  console.log(
    `Registered "${plan.name}": ${plan.startsAt.toISOString()} to ${plan.endsAt.toISOString()}, ` +
      `${plan.targetMatches} matches (registered ${plan.createdAt.toISOString()}). This cannot be changed.`,
  );
}

async function list() {
  const plans = await prisma.evaluationPlan.findMany({ orderBy: { createdAt: "desc" } });
  if (plans.length === 0) console.log("No evaluation plans registered.");
  for (const p of plans) {
    console.log(
      `${p.createdAt.toISOString()}  "${p.name}"  ${p.startsAt.toISOString().slice(0, 10)} to ` +
        `${p.endsAt.toISOString().slice(0, 10)}  target ${p.targetMatches}`,
    );
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === "create" && args.length === 4) await create(args[0], args[1], args[2], args[3]);
    else if (command === "list" && args.length === 0) await list();
    else usageAndExit();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
