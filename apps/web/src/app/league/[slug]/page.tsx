import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLeagueBySlug } from "../../../lib/queries";
import { formatPercent } from "../../../lib/format";
import { FixtureTable } from "../../../components/FixtureTable";
import { AdSlot } from "../../../components/AdSlot";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const MARKET_LABELS: Record<string, string> = {
  "1X2": "1X2",
  CORRECT_SCORE: "Correct score",
  OVER_UNDER_2_5: "Over/Under 2.5",
  BTTS: "Both teams to score",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLeagueBySlug(slug);
  if (!data) return {};
  return {
    title: `${data.league.name} predictions & standings`,
    description: `Standings, upcoming fixtures, and prediction accuracy for ${data.league.name}.`,
  };
}

export default async function LeagueHubPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getLeagueBySlug(slug);
  if (!data) notFound();

  const { league, teams, fixtures, accuracy } = data;

  const oneXTwoAccuracy = accuracy.find((stat) => stat.market === "1X2");
  const faqs = [
    {
      question: `How are ${league.name} predictions generated?`,
      answer:
        "Each prediction comes from a Poisson goal model, adjusted with a Dixon-Coles correction and blended with Elo team-strength ratings — computed from real season-to-date stats, never guessed. See our how-it-works page for the full explanation.",
    },
    ...(oneXTwoAccuracy
      ? [
          {
            question: `How accurate are ScorelineIQ's ${league.name} predictions?`,
            answer: `So far, our 1X2 predictions for ${league.name} have been correct ${formatPercent(oneXTwoAccuracy.hitRate)} of the time (${oneXTwoAccuracy.hitCount} of ${oneXTwoAccuracy.totalCount} scored predictions). See the full accuracy page for other markets.`,
          },
        ]
      : []),
    ...(teams.length > 0
      ? [
          {
            question: `How many ${league.name} teams does ScorelineIQ track?`,
            answer: `We currently have season stats for ${teams.length} team${teams.length === 1 ? "" : "s"} in ${league.name}.`,
          },
        ]
      : []),
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="flex flex-col gap-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{league.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{league.country}</p>
      </div>

      {accuracy.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            Prediction accuracy
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {accuracy.map((stat) => (
              <div key={stat.market} className="rounded-lg border border-blue-100 p-3">
                <div className="text-xs text-zinc-500">{MARKET_LABELS[stat.market] ?? stat.market}</div>
                <div className="mt-1 text-xl font-semibold text-blue-700">{formatPercent(stat.hitRate)}</div>
                <div className="text-xs text-zinc-400">{stat.hitCount}/{stat.totalCount}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {teams.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Standings</h2>
          <div className="overflow-x-auto rounded-lg border border-blue-100">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-blue-600 text-left text-xs font-semibold uppercase text-white">
                  <th className="py-2 pl-4 pr-2">Team</th>
                  <th className="px-2 text-right">P</th>
                  <th className="px-2 text-right">W</th>
                  <th className="px-2 text-right">D</th>
                  <th className="px-2 text-right">L</th>
                  <th className="px-2 text-right">GF</th>
                  <th className="px-2 text-right">GA</th>
                  <th className="py-2 pl-2 pr-4 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-t border-blue-50 odd:bg-white even:bg-blue-50/40">
                    <td className="py-2 pl-4 pr-2 font-medium">{team.name}</td>
                    <td className="px-2 text-right">{team.played}</td>
                    <td className="px-2 text-right">{team.won}</td>
                    <td className="px-2 text-right">{team.draw}</td>
                    <td className="px-2 text-right">{team.lost}</td>
                    <td className="px-2 text-right">{team.goalsFor}</td>
                    <td className="px-2 text-right">{team.goalsAgainst}</td>
                    <td className="py-2 pl-2 pr-4 text-right font-semibold">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Upcoming fixtures</h2>
        {fixtures.length === 0 ? (
          <p className="text-zinc-500">No upcoming fixtures ingested for this league yet.</p>
        ) : (
          <FixtureTable fixtures={fixtures} showLeague={false} />
        )}
      </section>

      {faqs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-medium">{faq.question}</h3>
                <p className="mt-1 text-sm text-zinc-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdSlot height={250} />
    </div>
  );
}
