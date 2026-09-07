import Link from "next/link";
import { getUpcomingFixtures, getAllLeaguesWithUpcomingCounts } from "../lib/queries";
import { formatDateHeading, toDateParam } from "../lib/format";
import { FixtureRow } from "../components/FixtureRow";
import { AdSlot } from "../components/AdSlot";

export const revalidate = 900; // 15 minutes

function groupByDay(fixtures: Awaited<ReturnType<typeof getUpcomingFixtures>>) {
  const groups = new Map<string, typeof fixtures>();
  for (const fixture of fixtures) {
    const key = toDateParam(fixture.kickoffAt);
    const existing = groups.get(key);
    if (existing) {
      existing.push(fixture);
    } else {
      groups.set(key, [fixture]);
    }
  }
  return groups;
}

export default async function Home() {
  const [fixtures, leagues] = await Promise.all([
    getUpcomingFixtures(2),
    getAllLeaguesWithUpcomingCounts(),
  ]);
  const grouped = groupByDay(fixtures);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today &amp; tomorrow&apos;s predictions</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Data-driven 1X2, correct score, over/under and BTTS predictions across{" "}
          <Link href="/accuracy" className="underline">
            tracked leagues
          </Link>
          .
        </p>
      </div>

      {fixtures.length === 0 ? (
        <p className="text-zinc-500">No fixtures in the pipeline right now — check back soon.</p>
      ) : (
        Array.from(grouped.entries()).map(([dateKey, dayFixtures]) => (
          <section key={dateKey} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              <Link href={`/predictions/${dateKey}`} className="hover:underline">
                {formatDateHeading(dayFixtures[0].kickoffAt)}
              </Link>
            </h2>
            <div className="flex flex-col gap-2">
              {dayFixtures.map((fixture) => (
                <FixtureRow key={fixture.id} fixture={fixture} />
              ))}
            </div>
          </section>
        ))
      )}

      {leagues.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Leagues we track</h2>
          <div className="flex flex-wrap gap-2">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/league/${league.slug}`}
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
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
