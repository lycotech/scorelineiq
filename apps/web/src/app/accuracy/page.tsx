import Link from "next/link";
import type { Metadata } from "next";
import { getAccuracyOverview, getProbabilityReport } from "../../lib/queries";
import { CREDIBLE_SAMPLE, MIN_SAMPLE, type Calibration, type MarketScore } from "../../lib/scoring";
import { formatPercent, formatShortDate } from "../../lib/format";

// See src/app/page.tsx for why this is dynamic rather than static+ISR.
export const dynamic = "force-dynamic";

const ACCURACY_TITLE = "Prediction accuracy";
const ACCURACY_DESCRIPTION =
  "ScorelineIQ's rolling hit-rate track record, by market and by league — published in full, win or lose.";

export const metadata: Metadata = {
  title: ACCURACY_TITLE,
  description: ACCURACY_DESCRIPTION,
  alternates: { canonical: "/accuracy" },
  openGraph: { title: ACCURACY_TITLE, description: ACCURACY_DESCRIPTION },
  twitter: { card: "summary_large_image", title: ACCURACY_TITLE, description: ACCURACY_DESCRIPTION },
};

const MARKET_LABELS: Record<string, string> = {
  "1X2": "1X2",
  CORRECT_SCORE: "Correct score",
  OVER_UNDER_2_5: "Over/Under 2.5",
  BTTS: "Both teams to score",
};

function fmt(n: number): string {
  return n.toFixed(3);
}

function skillText(skill: number | null): string {
  if (skill === null) return "–";
  const pct = Math.round(skill * 1000) / 10;
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function MarketScoreCard({ title, score }: { title: string; score: MarketScore }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-sm font-medium">{title}</div>
      <table className="mt-2 w-full text-sm">
        <tbody>
          <tr>
            <td className="py-1 text-zinc-500">ScorelineIQ model</td>
            <td className="py-1 text-right font-semibold text-primary">{fmt(score.brier)}</td>
          </tr>
          {score.baselines.map((b) => (
            <tr key={b.label}>
              <td className="py-1 pr-2 text-zinc-500">{b.label}</td>
              <td className="py-1 text-right">{fmt(b.brier)}</td>
            </tr>
          ))}
          <tr className="border-t border-border">
            <td className="py-1 text-zinc-500">Improvement over base rate</td>
            <td className="py-1 text-right font-semibold">{skillText(score.skillVsClimatology)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CalibrationTable({ title, calibration }: { title: string; calibration: Calibration }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">{title}</div>
        {calibration.expectedCalibrationError !== null ? (
          <div className="text-xs text-zinc-500">
            Avg. gap {Math.round(calibration.expectedCalibrationError * 1000) / 10} pts
          </div>
        ) : null}
      </div>
      <table className="mt-2 w-full text-xs">
        <thead className="text-zinc-500">
          <tr>
            <th className="py-1 text-left font-medium">Forecast</th>
            <th className="py-1 text-right font-medium">Matches</th>
            <th className="py-1 text-right font-medium">Avg. forecast</th>
            <th className="py-1 text-right font-medium">Actually happened</th>
          </tr>
        </thead>
        <tbody>
          {calibration.bins
            .filter((b) => b.n > 0)
            .map((b) => (
              <tr key={b.lower} className="border-t border-border">
                <td className="py-1">
                  {Math.round(b.lower * 100)}–{Math.round(b.upper * 100)}%
                </td>
                <td className="py-1 text-right">{b.n}</td>
                <td className="py-1 text-right">{formatPercent(b.meanPredicted as number)}</td>
                <td className="py-1 text-right">{formatPercent(b.observedRate as number)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AccuracyPage() {
  const [{ byLeague, overall }, quality] = await Promise.all([getAccuracyOverview(), getProbabilityReport()]);

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
          or removed. See the{" "}
          <Link href="/history" className="text-primary hover:underline">
            match-by-match prediction history
          </Link>
          .
        </p>
      </div>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-primary">Probability quality</h2>
        <p className="mb-3 max-w-2xl text-sm text-zinc-500">
          Hit rates only say how often the top pick was right. The Brier score measures the
          probabilities themselves — the average squared gap between each forecast and what
          happened, so lower is better — and is compared with simple reference forecasts on the
          same matches. Based only on the{" "}
          <Link href="/history" className="text-primary hover:underline">
            timestamped pre-kickoff record
          </Link>
          .
        </p>
        {quality.report === null ? (
          <p className="text-sm text-zinc-500">
            Not enough scored matches in the verified record yet ({quality.scoredMatches} of at least{" "}
            {MIN_SAMPLE}). Scores are withheld until the sample is large enough to mean something.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-500">
              {quality.report.n} matches
              {quality.firstKickoff && quality.lastKickoff
                ? `, kickoffs from ${formatShortDate(quality.firstKickoff)} to ${formatShortDate(quality.lastKickoff)}`
                : ""}
              .{" "}
              {quality.report.n < CREDIBLE_SAMPLE
                ? `Small sample (under ${CREDIBLE_SAMPLE} matches): treat these figures as provisional — differences from the baselines may be down to chance.`
                : ""}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <MarketScoreCard title="Match result (1X2)" score={quality.report.oneXTwo} />
              <MarketScoreCard title="Over/Under 2.5 goals" score={quality.report.over25} />
              <MarketScoreCard title="Both teams to score" score={quality.report.btts} />
            </div>
            <p className="text-xs text-zinc-400">
              Reference forecasts use the average outcome rates of these same matches, which
              flatters them slightly — a demanding comparison. Match result Brier ranges from 0
              (perfect) to 2; equal odds scores 0.667. Over/Under and BTTS range from 0 to 1; a
              50% coin flip scores 0.25.
            </p>
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Calibration: when we forecast X%, how often did it happen?
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <CalibrationTable title="Match result (1X2)" calibration={quality.report.calibration.oneXTwo} />
                <CalibrationTable title="Over 2.5 goals" calibration={quality.report.calibration.over25} />
                <CalibrationTable title="Both teams to score" calibration={quality.report.calibration.btts} />
              </div>
            </div>
          </div>
        )}
      </section>

      {overall.length === 0 ? (
        <p className="text-zinc-500">
          Not enough scored predictions yet to publish a track record. Check back once more
          fixtures have been played.
        </p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              Overall
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {overall.map((stat) => (
                <div key={stat.market} className="rounded-lg border border-border p-3">
                  <div className="text-xs text-zinc-500">{MARKET_LABELS[stat.market] ?? stat.market}</div>
                  <div className="mt-1 text-xl font-semibold text-primary">{formatPercent(stat.hitRate)}</div>
                  <div className="text-xs text-zinc-400">
                    {stat.hitCount}/{stat.totalCount}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">By league</h2>
            <div className="flex flex-col gap-4">
              {Array.from(byLeagueGrouped.entries()).map(([slug, stats]) => (
                <div key={slug} className="rounded-lg border border-border p-4">
                  <Link href={`/league/${slug}`} className="font-medium text-primary hover:underline">
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
