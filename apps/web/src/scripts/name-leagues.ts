// Gives real names to leagues that were saved with a placeholder name
// ("League #<id>") by the secondary-source import. Run by hand:
//
//   npm run name-leagues --workspace=web -- list
//   npm run name-leagues --workspace=web -- set <externalId> "<League name>" [country]
//
// <externalId> is the id shown by `list` (e.g. rapidapi:938219). Only the
// name (and optionally country) changes: the slug, and therefore every URL,
// stays the same. Safe to re-run. The provider doesn't supply names on our
// tier, so `list` prints sample teams to help you identify each league.
import { prisma } from "@scorelineiq/db";
import { isPlaceholderLeagueName, validateLeagueName } from "../lib/league-names";

function usageAndExit(): never {
  console.error(
    "Usage:\n" +
      "  npm run name-leagues --workspace=web -- list\n" +
      '  npm run name-leagues --workspace=web -- set <externalId> "<League name>" [country]',
  );
  process.exit(1);
}

async function list() {
  const leagues = await prisma.league.findMany({
    include: {
      _count: { select: { fixtures: true } },
      teams: { select: { name: true }, take: 4, orderBy: { name: "asc" } },
    },
    orderBy: { externalId: "asc" },
  });
  const placeholders = leagues.filter((l) => isPlaceholderLeagueName(l.name));
  if (placeholders.length === 0) console.log("No leagues with placeholder names.");
  for (const l of placeholders) {
    console.log(`${l.externalId}\t${l._count.fixtures} fixtures\t${l.teams.map((t) => t.name).join(", ")}`);
  }
  console.log(`\n${placeholders.length} of ${leagues.length} leagues have placeholder names.`);
}

async function set(externalId: string, rawName: string, country?: string) {
  const checked = validateLeagueName(rawName);
  if ("error" in checked) throw new Error(checked.error);
  const league = await prisma.league.findUnique({ where: { externalId } });
  if (!league) throw new Error(`No league with externalId "${externalId}".`);
  // Only placeholder-named leagues can be renamed here, so this can't
  // clobber a real league (Premier League, etc.) by mistake.
  if (!isPlaceholderLeagueName(league.name) && league.name !== checked.name) {
    throw new Error(`"${league.name}" already has a real name; refusing to rename it.`);
  }
  await prisma.league.update({
    where: { id: league.id },
    data: { name: checked.name, ...(country?.trim() ? { country: country.trim() } : {}) },
  });
  console.log(`${externalId}: "${league.name}" -> "${checked.name}" (slug unchanged: ${league.slug})`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    if (command === "list" && args.length === 0) await list();
    else if (command === "set" && (args.length === 2 || args.length === 3)) await set(args[0], args[1], args[2]);
    else usageAndExit();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
