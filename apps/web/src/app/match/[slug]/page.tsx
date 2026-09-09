import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getFixtureBySlug } from "../../../lib/queries";
import { generateMatchNarrative } from "../../../lib/narrative";
import { formatKickoff, formatPercent } from "../../../lib/format";
import { AdSlot } from "../../../components/AdSlot";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const fixture = await getFixtureBySlug(slug);
  if (!fixture) return {};

  const title = `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} prediction`;
  return {
    title,
    description: `${title} — 1X2, correct score, over/under 2.5 and BTTS predictions for this ${fixture.league.name} fixture.`,
  };
}

function ProbabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>{formatPercent(value)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary-soft">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default async function MatchPage({ params }: PageProps) {
  const { slug } = await params;
  const fixture = await getFixtureBySlug(slug);
  if (!fixture) notFound();

  const narrative = generateMatchNarrative(fixture.homeTeam, fixture.awayTeam);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
    startDate: fixture.kickoffAt.toISOString(),
    sport: "Football",
    homeTeam: { "@type": "SportsTeam", name: fixture.homeTeam.name },
    awayTeam: { "@type": "SportsTeam", name: fixture.awayTeam.name },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: fixture.league.name, item: `/league/${fixture.league.slug}` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <nav className="text-xs text-zinc-500">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/league/${fixture.league.slug}`} className="hover:underline">{fixture.league.name}</Link>
      </nav>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {fixture.homeTeam.name} vs {fixture.awayTeam.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {fixture.league.name} &middot; {formatKickoff(fixture.kickoffAt)}
        </p>
      </div>

      {fixture.result && (
        <div className="rounded-lg border border-zinc-200 p-4 text-center">
          <div className="text-xs uppercase text-zinc-500">Full time</div>
          <div className="mt-1 text-3xl font-semibold">
            {fixture.result.homeScore} – {fixture.result.awayScore}
          </div>
        </div>
      )}

      {fixture.prediction ? (
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              Match result (1X2)
            </h2>
            <div className="flex flex-col gap-3">
              <ProbabilityBar label={`${fixture.homeTeam.name} win`} value={fixture.prediction.homeWinProbability} />
              <ProbabilityBar label="Draw" value={fixture.prediction.drawProbability} />
              <ProbabilityBar label={`${fixture.awayTeam.name} win`} value={fixture.prediction.awayWinProbability} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-zinc-500">Predicted score</div>
              <div className="mt-1 text-xl font-semibold text-primary">
                {fixture.prediction.predictedScoreHome}-{fixture.prediction.predictedScoreAway}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-zinc-500">Avg. goals</div>
              <div className="mt-1 text-xl font-semibold text-primary">
                {fixture.prediction.expectedGoals !== null ? fixture.prediction.expectedGoals.toFixed(2) : "–"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-zinc-500">Over 2.5 goals</div>
              <div className="mt-1 text-xl font-semibold text-primary">{formatPercent(fixture.prediction.over25Probability)}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-zinc-500">BTTS</div>
              <div className="mt-1 text-xl font-semibold text-primary">{formatPercent(fixture.prediction.bttsProbability)}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-zinc-500">Confidence</div>
              <div className="mt-1 text-xl font-semibold text-primary">{fixture.prediction.confidence.toFixed(0)}%</div>
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong p-6 text-center text-zinc-500">
          Prediction pending — check back closer to kickoff.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">Form guide</h2>
        <div className="flex flex-col gap-2 text-sm text-zinc-700">
          {narrative.map((sentence, i) => (
            <p key={i}>{sentence}</p>
          ))}
        </div>
      </section>

      <AdSlot height={250} />

      {fixture.prediction && (
        <p className="text-xs text-zinc-400">
          Model version {fixture.prediction.modelVersion}. See{" "}
          <Link href="/how-it-works" className="underline">
            how predictions are made
          </Link>
          .
        </p>
      )}
    </div>
  );
}
