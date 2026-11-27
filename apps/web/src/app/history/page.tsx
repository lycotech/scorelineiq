import Link from "next/link";
import type { Metadata } from "next";
import { getPredictionHistory, HISTORY_ROW_LIMIT } from "../../lib/queries";
import { formatKickoff, formatPercent, formatShortDate, parseDateParam, toDateParam } from "../../lib/format";
import { splitPercents } from "../../lib/prediction-display";

// See src/app/page.tsx for why this is dynamic rather than static+ISR.
export const dynamic = "force-dynamic";

const TITLE = "Prediction history";
const DESCRIPTION =
  "Every ScorelineIQ prediction exactly as it stood before kickoff — timestamped, never edited, never deleted.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/history" },
  openGraph: { title: TITLE, description: DESCRIPTION },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function outcomeLabel(h: number, d: number, a: number): string {
  const max = Math.max(h, d, a);
  if (max === h) return "Home";
  if (max === d) return "Draw";
  return "Away";
}

function actualLabel(home: number, away: number): string {
  if (home > away) return "Home";
  if (home < away) return "Away";
  return "Draw";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = parseDateParam(toDateParam(new Date()))!;
  const toDate = (params.to && parseDateParam(params.to)) || today;
  const fromDate = (params.from && parseDateParam(params.from)) || new Date(toDate.getTime() - 30 * DAY_MS);
  const [lo, hi] = fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];

  // `to` is inclusive of that whole day.
  const history = await getPredictionHistory(lo, new Date(hi.getTime() + DAY_MS));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prediction history</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          The record below is append-only. Each prediction is stored with the time it was recorded,
          which the database guarantees is before kickoff, and the stored rows can&apos;t be edited
          or deleted — even by us. If the model re-ran and changed its numbers before kickoff, the
          latest pre-kickoff version is shown and the number of versions is noted. Results are
          statistical analysis, not betting advice. See also the{" "}
          <Link href="/accuracy" className="text-primary hover:underline">
            accuracy summary
          </Link>
          .
        </p>
        {history.recordStartedAt ? (
          <p className="mt-2 text-sm text-zinc-500">
            Record began {formatShortDate(history.recordStartedAt)} · {history.totalSnapshots} snapshots
            stored in total. Earlier predictions were overwritten before this record existed and are
            not included.
          </p>
        ) : null}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">From</span>
          <input type="date" name="from" defaultValue={toDateParam(lo)} className="rounded border border-border px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">To</span>
          <input type="date" name="to" defaultValue={toDateParam(hi)} className="rounded border border-border px-2 py-1" />
        </label>
        <button type="submit" className="rounded bg-primary px-3 py-1.5 font-medium text-white">
          Show
        </button>
      </form>

      {history.rows.length === 0 ? (
        <p className="text-zinc-500">
          No pre-kickoff predictions were recorded for matches in this date range.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            {history.rows.length} match{history.rows.length === 1 ? "" : "es"} with kickoff from{" "}
            {toDateParam(lo)} to {toDateParam(hi)}.
            {history.truncated ? ` Showing the latest ${HISTORY_ROW_LIMIT}; narrow the date range to see the rest.` : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="py-2 pr-3">Kickoff</th>
                  <th className="py-2 pr-3">Match</th>
                  <th className="py-2 pr-3">Home / Draw / Away</th>
                  <th className="py-2 pr-3">Likely score</th>
                  <th className="py-2 pr-3">O2.5 / BTTS</th>
                  <th className="py-2 pr-3">Recorded (UTC)</th>
                  <th className="py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {history.rows.map((r) => {
                  const predicted = outcomeLabel(r.homeWinProbability, r.drawProbability, r.awayWinProbability);
                  const shown = splitPercents(r.homeWinProbability, r.drawProbability, r.awayWinProbability);
                  return (
                    <tr key={r.fixtureSlug} className="border-t border-border align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">{formatKickoff(r.kickoffAt)}</td>
                      <td className="py-2 pr-3">
                        <Link href={`/match/${r.fixtureSlug}`} className="text-primary hover:underline">
                          {r.homeTeam} vs {r.awayTeam}
                        </Link>
                        <div className="text-xs text-zinc-400">{r.leagueName}</div>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {shown[0]}% / {shown[1]}% / {shown[2]}%
                        <div className="text-xs text-zinc-400">Leans: {predicted}</div>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {r.predictedScoreHome}-{r.predictedScoreAway}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatPercent(r.over25Probability)} / {formatPercent(r.bttsProbability)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {r.lockedAt.toISOString().slice(0, 16).replace("T", " ")}
                        {r.versions > 1 ? (
                          <div className="text-xs text-zinc-400">{r.versions} versions recorded</div>
                        ) : null}
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {r.result ? (
                          <>
                            {r.result.homeScore}-{r.result.awayScore}
                            <div className="text-xs text-zinc-400">
                              {actualLabel(r.result.homeScore, r.result.awayScore) === predicted
                                ? "1X2 matched"
                                : "1X2 missed"}
                            </div>
                          </>
                        ) : (
                          <span className="text-zinc-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
