import { Fragment } from "react";
import Link from "next/link";
import { formatKickoff, formatPercent } from "../lib/format";

export interface FixtureTableRowData {
  slug: string;
  kickoffAt: Date;
  league: { name: string; slug: string };
  homeTeam: { name: string; slug: string; form: string | null };
  awayTeam: { name: string; slug: string; form: string | null };
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    predictedScoreHome: number;
    predictedScoreAway: number;
    expectedGoals: number | null;
    over25Probability: number;
    bttsProbability: number;
    confidence: number;
  } | null;
  result: { homeScore: number; awayScore: number } | null;
}

export type Outcome = "1" | "X" | "2";

export function predictedOutcome(p: NonNullable<FixtureTableRowData["prediction"]>): Outcome {
  const max = Math.max(p.homeWinProbability, p.drawProbability, p.awayWinProbability);
  if (max === p.homeWinProbability) return "1";
  if (max === p.drawProbability) return "X";
  return "2";
}

export function outcomeLabel(outcome: Outcome, fixture: FixtureTableRowData): string {
  if (outcome === "1") return `${fixture.homeTeam.name} win`;
  if (outcome === "2") return `${fixture.awayTeam.name} win`;
  return "Draw";
}

function confidenceTier(confidence: number): string {
  if (confidence >= 70) return "High confidence";
  if (confidence >= 50) return "Moderate confidence";
  return "Close match";
}

// Compact three-way split bar (home / draw / away) sitting under the
// team names — a visual summary of the same three probabilities shown
// numerically in the 1/X/2 columns.
function ProbabilitySplitBar({ p }: { p: NonNullable<FixtureTableRowData["prediction"]> }) {
  return (
    <div className="mt-1.5 flex h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-border">
      <div className="bg-primary" style={{ width: `${p.homeWinProbability * 100}%` }} />
      <div className="bg-border-strong" style={{ width: `${p.drawProbability * 100}%` }} />
      <div className="bg-tertiary" style={{ width: `${p.awayWinProbability * 100}%` }} />
    </div>
  );
}

function FormBadge({ form }: { form: string }) {
  const results = form.split("").slice(-5);
  return (
    <span className="inline-flex gap-0.5">
      {results.map((r, i) => (
        <span
          key={i}
          className={
            "flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[8px] font-bold text-white " +
            (r === "W" ? "bg-secondary" : r === "L" ? "bg-tertiary" : "bg-border-strong")
          }
        >
          {r}
        </span>
      ))}
    </span>
  );
}

function FixtureRow({ fixture, showLeague }: { fixture: FixtureTableRowData; showLeague: boolean }) {
  const prediction = fixture.prediction;
  const outcome = prediction ? predictedOutcome(prediction) : null;

  return (
    <tr className="border-t border-border odd:bg-surface even:bg-background/60 hover:bg-primary-soft">
      <td className="px-4 py-3">
        <Link href={`/match/${fixture.slug}`} className="block">
          <div className="text-xs text-tertiary">
            {formatKickoff(fixture.kickoffAt)}
            {showLeague && <> &middot; {fixture.league.name}</>}
          </div>
          <div className="font-medium text-neutral">{fixture.homeTeam.name}</div>
          <div className="font-medium text-neutral">{fixture.awayTeam.name}</div>
          {prediction && <ProbabilitySplitBar p={prediction} />}
          {(fixture.homeTeam.form || fixture.awayTeam.form) && (
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-tertiary">
              {fixture.homeTeam.form && <FormBadge form={fixture.homeTeam.form} />}
              {fixture.awayTeam.form && <FormBadge form={fixture.awayTeam.form} />}
            </div>
          )}
        </Link>
      </td>

      {fixture.result ? (
        <>
          <td className="px-2 py-3 text-center text-border-strong">–</td>
          <td className="px-2 py-3 text-center text-border-strong">–</td>
          <td className="px-2 py-3 text-center text-border-strong">–</td>
          <td className="px-2 py-3 text-center text-border-strong">–</td>
          <td className="px-2 py-3 text-center font-semibold tnum">
            {fixture.result.homeScore}-{fixture.result.awayScore}
            <span className="ml-1 text-xs font-normal text-tertiary">FT</span>
          </td>
          <td className="px-2 py-3 text-center text-border-strong">–</td>
        </>
      ) : prediction && outcome ? (
        <>
          <td className="px-2 py-3 text-center font-semibold tnum">{formatPercent(prediction.homeWinProbability)}</td>
          <td className="px-2 py-3 text-center font-semibold tnum">{formatPercent(prediction.drawProbability)}</td>
          <td className="px-2 py-3 text-center font-semibold tnum">{formatPercent(prediction.awayWinProbability)}</td>
          <td className="px-2 py-3 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {outcome}
              </span>
              <span className="text-[10px] leading-tight text-tertiary">{confidenceTier(prediction.confidence)}</span>
            </div>
          </td>
          <td className="px-2 py-3 text-center">
            <div className="font-medium tnum">
              {prediction.predictedScoreHome}-{prediction.predictedScoreAway}
            </div>
            <div className="mt-1 inline-block rounded-sm bg-background px-1.5 py-0.5 text-[10px] text-tertiary">
              {prediction.over25Probability >= 0.5 ? "Over 2.5" : "Under 2.5"}
            </div>
          </td>
          <td className="px-2 py-3 text-center">
            <div className="font-medium tnum">
              {prediction.expectedGoals !== null ? prediction.expectedGoals.toFixed(2) : "–"}
            </div>
            <div className="mt-1 inline-block rounded-sm bg-background px-1.5 py-0.5 text-[10px] text-tertiary">
              BTTS {formatPercent(prediction.bttsProbability)}
            </div>
          </td>
        </>
      ) : (
        <td colSpan={6} className="px-2 py-3 text-center text-tertiary">
          Prediction pending
        </td>
      )}
    </tr>
  );
}

export function FixtureTable({
  fixtures,
  showLeague = true,
}: {
  fixtures: FixtureTableRowData[];
  showLeague?: boolean;
}) {
  const groups: { league: { name: string; slug: string }; fixtures: FixtureTableRowData[] }[] = [];
  if (showLeague) {
    const bySlug = new Map<string, { league: { name: string; slug: string }; fixtures: FixtureTableRowData[] }>();
    for (const fixture of fixtures) {
      const existing = bySlug.get(fixture.league.slug);
      if (existing) existing.fixtures.push(fixture);
      else bySlug.set(fixture.league.slug, { league: fixture.league, fixtures: [fixture] });
    }
    groups.push(...bySlug.values());
  } else {
    groups.push({ league: { name: "", slug: "" }, fixtures });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-primary text-left text-xs font-semibold uppercase tracking-wide text-white">
            <th className="px-4 py-3">Match</th>
            <th className="px-2 py-3 text-center">1</th>
            <th className="px-2 py-3 text-center">X</th>
            <th className="px-2 py-3 text-center">2</th>
            <th className="px-2 py-3 text-center">Pred</th>
            <th className="px-2 py-3 text-center">Score</th>
            <th className="px-2 py-3 text-center">Avg goals</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.league.slug || "all"}>
              {showLeague && (
                <tr key={`${group.league.slug}-header`} className="border-t border-border bg-background">
                  <td colSpan={7} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-tertiary">
                    {group.league.name}
                    <span className="ml-2 font-normal normal-case text-border-strong">
                      {group.fixtures.length} match{group.fixtures.length === 1 ? "" : "es"}
                    </span>
                  </td>
                </tr>
              )}
              {group.fixtures.map((fixture) => (
                <FixtureRow key={fixture.slug} fixture={fixture} showLeague={false} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
