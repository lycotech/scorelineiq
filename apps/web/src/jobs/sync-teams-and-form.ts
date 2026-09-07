import { prisma } from "@scorelineiq/db";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

// Football-Data.org's free tier allows 10 requests/minute; this keeps
// us comfortably under that across an arbitrary number of leagues.
const REQUEST_INTERVAL_MS = 6_500;

interface StandingsRow {
  team: { id: number };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string | null;
}

interface StandingsResponse {
  standings: { type: string; table: StandingsRow[] }[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStandings(competitionExternalId: string): Promise<StandingsRow[]> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not set");
  }

  const response = await fetch(
    `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionExternalId}/standings`,
    { headers: { "X-Auth-Token": token } },
  );

  if (!response.ok) {
    throw new Error(
      `Football-Data.org standings request failed for competition ${competitionExternalId}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as StandingsResponse;
  const total = data.standings.find((s) => s.type === "TOTAL");
  return total?.table ?? [];
}

async function syncLeagueStandings(league: { id: string; externalId: string; name: string }) {
  let table: StandingsRow[];
  try {
    table = await fetchStandings(league.externalId);
  } catch (error) {
    console.error(`[sync-teams-and-form] failed to fetch standings for "${league.name}":`, error);
    return { updated: 0, skipped: 0 };
  }

  let updated = 0;
  let skipped = 0;
  const now = new Date();

  for (const row of table) {
    const result = await prisma.team.updateMany({
      where: { externalId: String(row.team.id) },
      data: {
        played: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        points: row.points,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        form: row.form,
        standingsUpdatedAt: now,
      },
    });

    if (result.count > 0) {
      updated += 1;
    } else {
      // Team appears in the standings table but hasn't been created by
      // ingest-fixtures yet (e.g. hasn't had a fixture pulled in the
      // ingestion window) — skip rather than fabricate a team record
      // with guessed fields.
      skipped += 1;
    }
  }

  return { updated, skipped };
}

async function main() {
  const leagues = await prisma.league.findMany({
    select: { id: true, externalId: true, name: true },
  });

  console.log(`[sync-teams-and-form] syncing standings for ${leagues.length} league(s)`);

  let totalUpdated = 0;
  let totalSkipped = 0;

  for (let i = 0; i < leagues.length; i++) {
    const league = leagues[i];
    const { updated, skipped } = await syncLeagueStandings(league);
    totalUpdated += updated;
    totalSkipped += skipped;
    console.log(`[sync-teams-and-form] "${league.name}": ${updated} updated, ${skipped} skipped`);

    if (i < leagues.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  console.log(
    `[sync-teams-and-form] done: ${totalUpdated} teams updated, ${totalSkipped} skipped across ${leagues.length} league(s)`,
  );
}

main()
  .catch((error) => {
    console.error("[sync-teams-and-form] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
