import { getLiveMatches } from "../lib/livescore";

const MAX_SHOWN = 12;

export async function LiveScores() {
  const matches = await getLiveMatches();
  const live = matches.filter((m) => !m.finished);
  if (live.length === 0) return null;

  const shown = live.slice(0, MAX_SHOWN);

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-tertiary">
          Live now, worldwide
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((match) => (
          <div key={match.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <div className="truncate text-neutral">{match.home.name}</div>
              <div className="truncate text-neutral">{match.away.name}</div>
            </div>
            <div className="text-right font-semibold tnum text-neutral">
              <div>{match.home.score}</div>
              <div>{match.away.score}</div>
            </div>
          </div>
        ))}
      </div>
      {live.length > MAX_SHOWN && (
        <p className="mt-2 text-xs text-tertiary">+{live.length - MAX_SHOWN} more live right now</p>
      )}
    </section>
  );
}
