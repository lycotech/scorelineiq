import Link from "next/link";
import { formatKickoff, formatPercent } from "../lib/format";

export interface FixtureTableRowData {
  slug: string;
  kickoffAt: Date;
  league: { name: string; slug: string };
  homeTeam: { name: string; slug: string };
  awayTeam: { name: string; slug: string };
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    predictedScoreHome: number;
    predictedScoreAway: number;
    expectedGoals: number | null;
  } | null;
  result: { homeScore: number; awayScore: number } | null;
}

function predictedOutcome(p: NonNullable<FixtureTableRowData["prediction"]>): "1" | "X" | "2" {
  const max = Math.max(p.homeWinProbability, p.drawProbability, p.awayWinProbability);
  if (max === p.homeWinProbability) return "1";
  if (max === p.drawProbability) return "X";
  return "2";
}

export function FixtureTable({
  fixtures,
  showLeague = true,
}: {
  fixtures: FixtureTableRowData[];
  showLeague?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-blue-100 dark:border-slate-800">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="bg-blue-600 text-left text-xs font-semibold uppercase tracking-wide text-white">
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
          {fixtures.map((fixture) => (
            <tr
              key={fixture.slug}
              className="border-t border-blue-50 odd:bg-white even:bg-blue-50/40 hover:bg-blue-50 dark:border-slate-800 dark:odd:bg-slate-900 dark:even:bg-slate-900/60 dark:hover:bg-slate-800"
            >
              <td className="px-4 py-3">
                <Link href={`/match/${fixture.slug}`} className="block">
                  <div className="text-xs text-zinc-500">
                    {formatKickoff(fixture.kickoffAt)}
                    {showLeague && <> &middot; {fixture.league.name}</>}
                  </div>
                  <div className="font-medium text-blue-950 dark:text-blue-100">{fixture.homeTeam.name}</div>
                  <div className="font-medium text-blue-950 dark:text-blue-100">{fixture.awayTeam.name}</div>
                </Link>
              </td>

              {fixture.result ? (
                <>
                  <td className="px-2 py-3 text-center text-zinc-300 dark:text-zinc-600">–</td>
                  <td className="px-2 py-3 text-center text-zinc-300 dark:text-zinc-600">–</td>
                  <td className="px-2 py-3 text-center text-zinc-300 dark:text-zinc-600">–</td>
                  <td className="px-2 py-3 text-center text-zinc-300 dark:text-zinc-600">–</td>
                  <td className="px-2 py-3 text-center font-semibold">
                    {fixture.result.homeScore}-{fixture.result.awayScore}
                    <span className="ml-1 text-xs font-normal text-zinc-400">FT</span>
                  </td>
                  <td className="px-2 py-3 text-center text-zinc-300 dark:text-zinc-600">–</td>
                </>
              ) : fixture.prediction ? (
                <>
                  <td className="px-2 py-3 text-center">{formatPercent(fixture.prediction.homeWinProbability)}</td>
                  <td className="px-2 py-3 text-center">{formatPercent(fixture.prediction.drawProbability)}</td>
                  <td className="px-2 py-3 text-center">{formatPercent(fixture.prediction.awayWinProbability)}</td>
                  <td className="px-2 py-3 text-center">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {predictedOutcome(fixture.prediction)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center font-medium">
                    {fixture.prediction.predictedScoreHome}-{fixture.prediction.predictedScoreAway}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {fixture.prediction.expectedGoals !== null
                      ? fixture.prediction.expectedGoals.toFixed(2)
                      : "–"}
                  </td>
                </>
              ) : (
                <td colSpan={6} className="px-2 py-3 text-center text-zinc-400">
                  Prediction pending
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
