import Link from "next/link";
import type { Metadata } from "next";
import { getAccuracyOverview } from "../../lib/queries";
import { formatPercent } from "../../lib/format";

// See src/app/page.tsx for why this is dynamic rather than static+ISR.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prediction accuracy",
  description: "ScorelineIQ's rolling hit-rate track record, by market and by league — published in full, win or lose.",
};

const MARKET_LABELS: Record<string, string> = {
  "1X2": "1X2",
  CORRECT_SCORE: "Correct score",
  OVER_UNDER_2_5: "Over/Under 2.5",
  BTTS: "Both teams to score",
};

export default async function AccuracyPage() {
  const { byLeague, overall } = await getAccuracyOverview();

  const byLeagueGrouped = new Map<string, typeof byLeague>();
  for (const stat of byLeague) {
    const key = stat.league.slug;
    const existing = byLeagueGrouped.get(key);
    if (existing) existing.push(stat);
    else byLeagueGrouped.set(key, [stat]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accuracy track record</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Every prediction we publish is scored against the final result the next day, win or
          lose. These are all-time hit rates since we started tracking — nothing is cherry-picked
          or removed.
        </p>
      </div>

      {overall.length === 0 ? (
        <p className="text-zinc-500">
          Not enough scored predictions yet to publish a track record. Check back once more
          fixtures have been played.
        </p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
              Overall
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {overall.map((stat) => (
                <div key={stat.market} className="rounded-lg border border-blue-100 p-3">
                  <div className="text-xs text-zinc-500">{MARKET_LABELS[stat.market] ?? stat.market}</div>
                  <div className="mt-1 text-xl font-semibold text-blue-700">{formatPercent(stat.hitRate)}</div>
                  <div className="text-xs text-zinc-400">
                    {stat.hitCount}/{stat.totalCount}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">By league</h2>
            <div className="flex flex-col gap-4">
              {Array.from(byLeagueGrouped.entries()).map(([slug, stats]) => (
                <div key={slug} className="rounded-lg border border-blue-100 p-4">
                  <Link href={`/league/${slug}`} className="font-medium text-blue-700 hover:underline">
                    {stats[0].league.name}
                  </Link>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map((stat) => (
                      <div key={stat.market}>
                        <div className="text-xs text-zinc-500">{MARKET_LABELS[stat.market] ?? stat.market}</div>
                        <div className="text-sm font-semibold">
                          {formatPercent(stat.hitRate)}{" "}
                          <span className="font-normal text-zinc-400">
                            ({stat.hitCount}/{stat.totalCount})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
