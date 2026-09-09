import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminFixtureDetail } from "../../../../lib/queries";
import { formatKickoff } from "../../../../lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string; reason?: string }>;
}

function TeamStatsCard({
  team,
}: {
  team: {
    name: string;
    played: number | null;
    won: number | null;
    draw: number | null;
    lost: number | null;
    goalsFor: number | null;
    goalsAgainst: number | null;
    eloRating: number;
    form: string | null;
  };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="font-semibold text-neutral">{team.name}</div>
      <div className="mt-1 text-xs text-tertiary">
        {team.played !== null ? (
          <>
            P{team.played} W{team.won} D{team.draw} L{team.lost} &middot; GF {team.goalsFor} GA {team.goalsAgainst}
          </>
        ) : (
          "No season stats synced yet"
        )}
      </div>
      <div className="text-xs text-tertiary">Elo {team.eloRating.toFixed(0)} {team.form && <>&middot; Form {team.form}</>}</div>
    </div>
  );
}

export default async function AdminFixtureDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { result, reason } = await searchParams;
  const fixture = await getAdminFixtureDetail(id);
  if (!fixture) notFound();

  const p = fixture.prediction;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-sm text-tertiary hover:text-primary">
          &larr; Back to fixtures
        </Link>
        <h1 className="mt-1 text-xl font-bold text-neutral">
          {fixture.homeTeam.name} vs {fixture.awayTeam.name}
        </h1>
        <p className="text-sm text-tertiary">
          {fixture.league.name} &middot; {formatKickoff(fixture.kickoffAt)} &middot; {fixture.status}
        </p>
      </div>

      {result === "generated" && (
        <p className="rounded-md border border-secondary-border bg-secondary-container px-3 py-2 text-sm text-secondary-text">
          Prediction generated from the model.
        </p>
      )}
      {result === "pending" && (
        <p className="rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-tertiary">
          Model couldn&apos;t generate a prediction: {reason}
        </p>
      )}
      {result === "saved" && (
        <p className="rounded-md border border-secondary-border bg-secondary-container px-3 py-2 text-sm text-secondary-text">
          Manual prediction saved.
        </p>
      )}
      {result === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Error: {reason}</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TeamStatsCard team={fixture.homeTeam} />
        <TeamStatsCard team={fixture.awayTeam} />
      </div>

      {fixture.result && (
        <div className="rounded-lg border border-border bg-surface p-3 text-sm">
          <span className="font-semibold text-neutral">Final score:</span> {fixture.result.homeScore}-
          {fixture.result.awayScore}
        </div>
      )}

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Current prediction</h2>
        {p ? (
          <div className="mt-2 text-sm text-neutral">
            <div>
              1X2: {(p.homeWinProbability * 100).toFixed(0)}% / {(p.drawProbability * 100).toFixed(0)}% /{" "}
              {(p.awayWinProbability * 100).toFixed(0)}%
            </div>
            <div>
              Predicted score: {p.predictedScoreHome}-{p.predictedScoreAway} &middot; Avg goals{" "}
              {p.expectedGoals?.toFixed(2) ?? "–"}
            </div>
            <div>
              Over 2.5: {(p.over25Probability * 100).toFixed(0)}% &middot; BTTS: {(p.bttsProbability * 100).toFixed(0)}%{" "}
              &middot; Confidence: {p.confidence.toFixed(0)}%
            </div>
            <div className="mt-1 text-xs text-tertiary">
              Source: {p.modelVersion} &middot; generated {p.generatedAt.toISOString()}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-tertiary">No prediction yet.</p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Generate with model</h2>
        <p className="mt-1 text-xs text-tertiary">
          Runs the same Poisson/Dixon-Coles/Elo model the nightly job uses, right now, for this fixture only.
          Requires both teams to have synced season stats.
        </p>
        <form method="POST" action={`/api/admin/fixture/${fixture.id}/generate`} className="mt-3">
          <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Generate with model
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">Manual override</h2>
        <p className="mt-1 text-xs text-tertiary">
          Saved predictions are tagged &quot;manual-override&quot; and shown as such on the public match page — never
          disguised as model output.
        </p>
        <form method="POST" action={`/api/admin/fixture/${fixture.id}/manual`} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <NumField label="Home win %" name="homeWinProbability" defaultValue={p ? Math.round(p.homeWinProbability * 100) : ""} />
          <NumField label="Draw %" name="drawProbability" defaultValue={p ? Math.round(p.drawProbability * 100) : ""} />
          <NumField label="Away win %" name="awayWinProbability" defaultValue={p ? Math.round(p.awayWinProbability * 100) : ""} />
          <NumField label="Predicted home score" name="predictedScoreHome" defaultValue={p?.predictedScoreHome ?? ""} />
          <NumField label="Predicted away score" name="predictedScoreAway" defaultValue={p?.predictedScoreAway ?? ""} />
          <NumField label="Avg. total goals" name="expectedGoals" step="0.01" defaultValue={p?.expectedGoals ?? ""} />
          <NumField label="Over 2.5 %" name="over25Probability" defaultValue={p ? Math.round(p.over25Probability * 100) : ""} />
          <NumField label="BTTS %" name="bttsProbability" defaultValue={p ? Math.round(p.bttsProbability * 100) : ""} />
          <NumField label="Confidence %" name="confidence" defaultValue={p ? Math.round(p.confidence) : ""} />
          <div className="col-span-full">
            <button type="submit" className="rounded-md border border-border-strong px-3 py-2 text-sm font-semibold text-neutral hover:bg-background">
              Save manual prediction
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function NumField({
  label,
  name,
  defaultValue,
  step = "1",
}: {
  label: string;
  name: string;
  defaultValue: number | string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-tertiary">
      {label}
      <input
        type="number"
        name={name}
        step={step}
        required
        defaultValue={defaultValue}
        className="rounded-md border border-border-strong bg-surface px-2 py-1.5 text-sm text-neutral focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
