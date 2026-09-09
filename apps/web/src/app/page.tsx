import Link from "next/link";
import { getFixturesForDate, getAllLeaguesWithUpcomingCounts } from "../lib/queries";
import { formatDateHeading } from "../lib/format";
import { DayTabs } from "../components/DayTabs";
import { FixtureTable } from "../components/FixtureTable";
import { AdSlot } from "../components/AdSlot";

// Rendered per-request rather than statically + ISR-revalidated: a
// static build would need a live database reachable from inside the
// Docker build itself, which isn't available (see apps/web/Dockerfile).
// At current traffic this trades a small amount of caching for a
// build that doesn't depend on build-time network conditions.
export const dynamic = "force-dynamic";

export default async function Home() {
  const today = new Date();
  const [fixtures, leagues] = await Promise.all([
    getFixturesForDate(today),
    getAllLeaguesWithUpcomingCounts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s predictions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Data-driven 1X2, correct score and expected-goals predictions across{" "}
          <Link href="/accuracy" className="text-blue-700 underline">
            tracked leagues
          </Link>
          .
        </p>
      </div>

      <DayTabs activeDate={today} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          {formatDateHeading(today)}
        </h2>
        {fixtures.length === 0 ? (
          <p className="text-zinc-500">No fixtures in the pipeline for today — check another day above.</p>
        ) : (
          <FixtureTable fixtures={fixtures} />
        )}
      </div>

      {leagues.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Leagues we track</h2>
          <div className="flex flex-wrap gap-2">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/league/${league.slug}`}
                className="rounded-full border border-blue-200 px-3 py-1 text-sm text-blue-700 hover:border-blue-400 hover:bg-blue-50"
              >
                {league.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot height={250} />
    </div>
  );
}
