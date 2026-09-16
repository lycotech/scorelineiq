import Link from "next/link";
import { fetchExternalFixtures } from "../../../lib/external-fixtures";
import { getImportedExternalLeagues, getImportedExternalFixtures } from "../../../lib/queries";
import { formatKickoff, toDateParam, parseDateParam } from "../../../lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ date?: string; result?: string; reason?: string }>;
}

export default async function ExternalFixturesPage({ searchParams }: PageProps) {
  const { date: dateParam, result, reason } = await searchParams;
  const date = (dateParam && parseDateParam(dateParam)) || new Date();
  const dateStr = toDateParam(date);
  const apiDate = dateStr.replace(/-/g, "");

  const prevDate = toDateParam(new Date(date.getTime() - 24 * 60 * 60 * 1000));
  const nextDate = toDateParam(new Date(date.getTime() + 24 * 60 * 60 * 1000));

  const [fixtures, importedLeagues, importedFixtures] = await Promise.all([
    fetchExternalFixtures(apiDate),
    getImportedExternalLeagues(),
    getImportedExternalFixtures(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin" className="text-sm text-tertiary hover:text-primary">
          &larr; Back to admin
        </Link>
        <h1 className="mt-1 text-xl font-bold text-neutral">More fixtures (secondary source)</h1>
        <p className="text-sm text-tertiary">
          Covers ~150+ leagues our main pipeline doesn&apos;t, but has no season-stats endpoint on our tier — so no
          automatic predictions here, and league names aren&apos;t resolvable from this API. Name the league yourself
          the first time you import from it; every later fixture from the same league reuses that name.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Link href={`/admin/external-fixtures?date=${prevDate}`} className="rounded-md border border-border-strong px-3 py-1.5 text-tertiary hover:bg-background">
          &larr; Prev day
        </Link>
        <span className="font-medium text-neutral">{dateStr}</span>
        <Link href={`/admin/external-fixtures?date=${nextDate}`} className="rounded-md border border-border-strong px-3 py-1.5 text-tertiary hover:bg-background">
          Next day &rarr;
        </Link>
      </div>

      {result === "imported" && (
        <p className="rounded-md border border-secondary-border bg-secondary-container px-3 py-2 text-sm text-secondary-text">
          Imported. Redirected below to set its prediction.
        </p>
      )}
      {result === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Error: {reason}</p>
      )}

      {fixtures.length === 0 ? (
        <p className="text-sm text-tertiary">
          No fixtures returned for this date (or RAPIDAPI_FOOTBALL_STATS_KEY is unset, or the monthly quota is
          exhausted).
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-background text-left text-xs font-semibold uppercase tracking-wide text-tertiary">
                <th className="px-4 py-2">Kickoff</th>
                <th className="px-2 py-2">Match</th>
                <th className="px-2 py-2">League</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {fixtures.map((fixture) => {
                const existingFixtureId = importedFixtures.get(fixture.externalId);
                const existingLeague = importedLeagues.get(fixture.leagueExternalId);

                return (
                  <tr key={fixture.externalId} className="border-t border-border">
                    <td className="px-4 py-2 text-xs text-tertiary">{formatKickoff(new Date(fixture.kickoffAt))}</td>
                    <td className="px-2 py-2 font-medium text-neutral">
                      {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                    </td>
                    <td className="px-2 py-2 text-xs text-tertiary">
                      {existingLeague ? existingLeague.name : `League #${fixture.leagueExternalId} (new)`}
                    </td>
                    <td className="px-2 py-2">
                      {existingFixtureId ? (
                        <Link href={`/admin/fixture/${existingFixtureId}`} className="text-sm font-medium text-primary hover:underline">
                          Edit prediction &rarr;
                        </Link>
                      ) : (
                        <form method="POST" action="/api/admin/external-fixtures/import" className="flex items-center gap-2">
                          <input type="hidden" name="fixtureExternalId" value={fixture.externalId} />
                          <input type="hidden" name="kickoffAt" value={fixture.kickoffAt} />
                          <input type="hidden" name="homeTeamExternalId" value={fixture.homeTeam.externalId} />
                          <input type="hidden" name="homeTeamName" value={fixture.homeTeam.name} />
                          <input type="hidden" name="awayTeamExternalId" value={fixture.awayTeam.externalId} />
                          <input type="hidden" name="awayTeamName" value={fixture.awayTeam.name} />
                          <input type="hidden" name="leagueExternalId" value={fixture.leagueExternalId} />
                          {!existingLeague && (
                            <input
                              type="text"
                              name="leagueName"
                              defaultValue={`League #${fixture.leagueExternalId}`}
                              className="w-40 rounded-md border border-border-strong bg-surface px-2 py-1 text-xs text-neutral focus:border-primary focus:outline-none"
                            />
                          )}
                          <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">
                            Import
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
