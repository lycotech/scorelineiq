import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFixturesForDate } from "../../../lib/queries";
import { formatDateHeading, parseDateParam } from "../../../lib/format";
import { DayTabs } from "../../../components/DayTabs";
import { FixtureTable } from "../../../components/FixtureTable";
import { AdSlot } from "../../../components/AdSlot";

export const revalidate = 900;

interface PageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const parsed = parseDateParam(date);
  if (!parsed) return {};
  return {
    title: `Football predictions for ${formatDateHeading(parsed)}`,
    description: `All football match predictions for ${formatDateHeading(parsed)} across tracked leagues.`,
  };
}

export default async function DayArchivePage({ params }: PageProps) {
  const { date } = await params;
  const parsedDate = parseDateParam(date);
  if (!parsedDate) notFound();

  const fixtures = await getFixturesForDate(parsedDate);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{formatDateHeading(parsedDate)}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {fixtures.length} fixture{fixtures.length === 1 ? "" : "s"} tracked for this date.
        </p>
      </div>

      <DayTabs activeDate={parsedDate} />

      {fixtures.length === 0 ? (
        <p className="text-zinc-500">No fixtures ingested for this date.</p>
      ) : (
        <FixtureTable fixtures={fixtures} />
      )}

      <AdSlot height={250} />
    </div>
  );
}
