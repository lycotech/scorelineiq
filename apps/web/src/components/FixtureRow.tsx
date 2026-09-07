import Link from "next/link";
import { formatKickoff, formatPercent } from "../lib/format";

export interface FixtureRowData {
  slug: string;
  kickoffAt: Date;
  status: string;
  league: { name: string; slug: string };
  homeTeam: { name: string; slug: string };
  awayTeam: { name: string; slug: string };
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    predictedScoreHome: number;
    predictedScoreAway: number;
    confidence: number;
  } | null;
  result: { homeScore: number; awayScore: number } | null;
}

export function FixtureRow({ fixture, showLeague = true }: { fixture: FixtureRowData; showLeague?: boolean }) {
  return (
    <Link
      href={`/match/${fixture.slug}`}
      className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatKickoff(fixture.kickoffAt)}</span>
          {showLeague && (
            <>
              <span>&middot;</span>
              <span>{fixture.league.name}</span>
            </>
          )}
        </div>
        <div className="mt-1 truncate font-medium">
          {fixture.homeTeam.name} <span className="text-zinc-400">vs</span> {fixture.awayTeam.name}
        </div>
      </div>

      <div className="flex-shrink-0 text-sm">
        {fixture.result ? (
          <span className="font-semibold">
            {fixture.result.homeScore} – {fixture.result.awayScore}
          </span>
        ) : fixture.prediction ? (
          <div className="flex items-center gap-3">
            <span className="text-zinc-500">
              {formatPercent(fixture.prediction.homeWinProbability)} /{" "}
              {formatPercent(fixture.prediction.drawProbability)} /{" "}
              {formatPercent(fixture.prediction.awayWinProbability)}
            </span>
            <span className="rounded bg-zinc-100 px-2 py-1 font-medium dark:bg-zinc-800">
              {fixture.prediction.predictedScoreHome}-{fixture.prediction.predictedScoreAway}
            </span>
          </div>
        ) : (
          <span className="text-zinc-400">Prediction pending</span>
        )}
      </div>
    </Link>
  );
}
