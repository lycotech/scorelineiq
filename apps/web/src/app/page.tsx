import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getFixturesForDate, getAllLeaguesWithUpcomingCounts, getAccuracyOverview } from "../lib/queries";
import { formatRelativeTime } from "../lib/format";
import { DayTabs } from "../components/DayTabs";
import { FixtureTable, predictedOutcome, outcomeLabel } from "../components/FixtureTable";
import { StatsBar, type StatsBarData } from "../components/StatsBar";
import { LiveScores } from "../components/LiveScores";
import { AdSlot } from "../components/AdSlot";

// Rendered per-request rather than statically + ISR-revalidated: a
// static build would need a live database reachable from inside the
// Docker build itself, which isn't available (see apps/web/Dockerfile).
// At current traffic this trades a small amount of caching for a
// build that doesn't depend on build-time network conditions.
export const dynamic = "force-dynamic";

// The root layout's title template ("%s | ScorelineIQ") only applies to
// titles set by segments *below* the one defining it — a title set here,
// at the same root segment as the layout, doesn't get it appended
// automatically (confirmed: every other page gets the suffix, this one
// didn't until spelled out explicitly).
const HOME_TITLE = "Today's Football Predictions — 1X2, Correct Score & BTTS | ScorelineIQ";
const HOME_DESCRIPTION =
  "Free, data-driven football predictions for today's fixtures across the Premier League, Bundesliga, Ligue 1, Eredivisie and more — 1X2 probabilities, correct scores, over/under and BTTS from a Poisson-Dixon-Coles-Elo model.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: HOME_TITLE, description: HOME_DESCRIPTION },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION },
};

type FixtureRow = Awaited<ReturnType<typeof getFixturesForDate>>[number];

function buildStatsBarData(fixtures: FixtureRow[], accuracy: Awaited<ReturnType<typeof getAccuracyOverview>>): StatsBarData {
  const withPrediction = fixtures.filter(
    (f): f is FixtureRow & { prediction: NonNullable<FixtureRow["prediction"]> } => f.prediction !== null,
  );
  const leagueSlugs = new Set(fixtures.map((f) => f.league.slug));

  const avgConfidence =
    withPrediction.length > 0
      ? withPrediction.reduce((sum, f) => sum + f.prediction.confidence, 0) / withPrediction.length
      : null;

  const oneXTwo = accuracy.overall.find((stat) => stat.market === "1X2");

  const topPickFixture = withPrediction.reduce<(typeof withPrediction)[number] | null>((best, f) => {
    if (!best || f.prediction.confidence > best.prediction.confidence) return f;
    return best;
  }, null);

  const topPick = topPickFixture
    ? {
        slug: topPickFixture.slug,
        label: `${topPickFixture.homeTeam.name} vs ${topPickFixture.awayTeam.name}`,
        outcomeLabel: outcomeLabel(predictedOutcome(topPickFixture.prediction), topPickFixture),
        confidence: topPickFixture.prediction.confidence,
      }
    : null;

  return {
    fixturesTodayCount: fixtures.length,
    leaguesTodayCount: leagueSlugs.size,
    avgConfidence,
    accuracy: oneXTwo && oneXTwo.totalCount > 0 ? { hitRate: oneXTwo.hitRate, totalCount: oneXTwo.totalCount } : null,
    topPick,
  };
}

export default async function Home() {
  const today = new Date();
  const [fixtures, leagues, accuracy] = await Promise.all([
    getFixturesForDate(today),
    getAllLeaguesWithUpcomingCounts(),
    getAccuracyOverview(),
  ]);

  const statsBarData = buildStatsBarData(fixtures, accuracy);

  const latestGeneratedAt = fixtures.reduce<Date | null>((latest, f) => {
    const generatedAt = f.prediction?.generatedAt ?? null;
    if (!generatedAt) return latest;
    return !latest || generatedAt > latest ? generatedAt : latest;
  }, null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral">Today&apos;s Predictions</h1>
          <p className="mt-1 text-sm text-tertiary">
            Data-driven 1X2, correct score and expected-goals predictions across{" "}
            <Link href="/accuracy" className="text-primary underline">
              tracked leagues
            </Link>
            .
          </p>
        </div>
        {latestGeneratedAt && (
          <div className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-tertiary">
            Poisson-Dixon-Coles-Elo model &middot; updated {formatRelativeTime(latestGeneratedAt)}
          </div>
        )}
      </div>

      <StatsBar data={statsBarData} />

      <Suspense fallback={null}>
        <LiveScores />
      </Suspense>

      <DayTabs activeDate={today} />

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-tertiary">Today&apos;s fixtures</h2>
        {fixtures.length === 0 ? (
          <p className="text-tertiary">No fixtures in the pipeline for today — check another day above.</p>
        ) : (
          <FixtureTable fixtures={fixtures} />
        )}
      </div>

      {leagues.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-tertiary">Leagues we track</h2>
          <div className="flex flex-wrap gap-2">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/league/${league.slug}`}
                className="rounded-md border border-border px-3 py-1 text-sm text-tertiary hover:border-primary hover:text-primary"
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
