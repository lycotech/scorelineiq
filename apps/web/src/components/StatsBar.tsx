import Link from "next/link";
import { formatPercent } from "../lib/format";

export interface StatsBarData {
  fixturesTodayCount: number;
  leaguesTodayCount: number;
  avgConfidence: number | null;
  accuracy: { hitRate: number; totalCount: number } | null;
  topPick: {
    slug: string;
    label: string;
    outcomeLabel: string;
    confidence: number;
  } | null;
}

function StatCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-tertiary">{label}</div>
      {children}
    </div>
  );
}

export function StatsBar({ data }: { data: StatsBarData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Fixtures tracked">
        <div className="mt-1 text-2xl font-bold tnum text-neutral">{data.fixturesTodayCount}</div>
        <div className="text-xs text-tertiary">
          across {data.leaguesTodayCount} league{data.leaguesTodayCount === 1 ? "" : "s"}
        </div>
      </StatCard>

      <StatCard label="Avg. model confidence">
        <div className="mt-1 text-2xl font-bold tnum text-neutral">
          {data.avgConfidence !== null ? `${data.avgConfidence.toFixed(0)}%` : "–"}
        </div>
        <div className="text-xs text-tertiary">across today&apos;s predictions</div>
      </StatCard>

      <StatCard label="1X2 accuracy (all-time)">
        {data.accuracy ? (
          <>
            <div className="mt-1 text-2xl font-bold tnum text-neutral">{formatPercent(data.accuracy.hitRate)}</div>
            <div className="text-xs text-tertiary">{data.accuracy.totalCount} scored predictions</div>
          </>
        ) : (
          <>
            <div className="mt-1 text-2xl font-bold text-neutral">–</div>
            <div className="text-xs text-tertiary">
              <Link href="/accuracy" className="hover:text-primary">
                Not enough data yet
              </Link>
            </div>
          </>
        )}
      </StatCard>

      <StatCard label="Today's top pick">
        {data.topPick ? (
          <Link href={`/match/${data.topPick.slug}`} className="block">
            <div className="mt-1 truncate text-sm font-semibold text-primary">{data.topPick.label}</div>
            <div className="text-xs text-tertiary">
              {data.topPick.outcomeLabel} &middot; {data.topPick.confidence.toFixed(0)}% confidence
            </div>
          </Link>
        ) : (
          <div className="mt-1 text-sm text-tertiary">No predictions yet today</div>
        )}
      </StatCard>
    </div>
  );
}
