import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getFixturesForDate } from "../../../lib/queries";
import { formatDateHeading, parseDateParam, toDateParam } from "../../../lib/format";
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
  const title = `Football predictions for ${formatDateHeading(parsed)}`;
  const description = `All football match predictions for ${formatDateHeading(parsed)} across tracked leagues.`;

  // Today's archive page lists the exact same fixtures as the
  // homepage — real duplicate content, not just a theoretical risk
  // (confirmed: same fixture set both ways). Point search engines at
  // "/" as the canonical version rather than self-canonicalizing.
  const isToday = date === toDateParam(new Date());

  return {
    title,
    description,
    alternates: { canonical: isToday ? "/" : `/predictions/${date}` },
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function DayArchivePage({ params }: PageProps) {
  const { date } = await params;
  const parsedDate = parseDateParam(date);
  if (!parsedDate) notFound();

  const fixtures = await getFixturesForDate(parsedDate);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      { "@type": "ListItem", position: 2, name: formatDateHeading(parsedDate) },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

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
