import Link from "next/link";
import { getAdminFixtures } from "../../lib/queries";
import { formatKickoff } from "../../lib/format";

export const dynamic = "force-dynamic";

function statusLabel(prediction: { modelVersion: string; confidence: number } | null, hasResult: boolean) {
  if (hasResult) return { text: "Played", tone: "text-tertiary" };
  if (!prediction) return { text: "No prediction", tone: "text-tertiary" };
  if (prediction.modelVersion === "manual-override") {
    return { text: `Manual override · ${prediction.confidence.toFixed(0)}%`, tone: "text-secondary-text" };
  }
  return { text: `Model · ${prediction.confidence.toFixed(0)}%`, tone: "text-primary" };
}

export default async function AdminDashboardPage() {
  const fixtures = await getAdminFixtures();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral">Admin — Fixtures</h1>
          <p className="text-sm text-tertiary">Last 2 days through the next 9 days. Click a fixture to view or edit its prediction.</p>
        </div>
        <form method="POST" action="/api/admin/logout">
          <button type="submit" className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-tertiary hover:bg-background">
            Sign out
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-background text-left text-xs font-semibold uppercase tracking-wide text-tertiary">
              <th className="px-4 py-2">Kickoff</th>
              <th className="px-2 py-2">League</th>
              <th className="px-2 py-2">Match</th>
              <th className="px-2 py-2">Prediction status</th>
            </tr>
          </thead>
          <tbody>
            {fixtures.map((fixture) => {
              const status = statusLabel(fixture.prediction, fixture.result !== null);
              return (
                <tr key={fixture.id} className="border-t border-border hover:bg-primary-soft">
                  <td className="px-4 py-2 text-xs text-tertiary">{formatKickoff(fixture.kickoffAt)}</td>
                  <td className="px-2 py-2 text-xs text-tertiary">{fixture.league.name}</td>
                  <td className="px-2 py-2">
                    <Link href={`/admin/fixture/${fixture.id}`} className="font-medium text-neutral hover:text-primary">
                      {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                    </Link>
                  </td>
                  <td className={`px-2 py-2 text-xs font-medium ${status.tone}`}>{status.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
