import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About ScorelineIQ — a free, data-driven football prediction and stats site.",
};

export default function AboutPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">About ScorelineIQ</h1>

      <p>
        ScorelineIQ is a free football prediction and statistics site. We publish data-driven
        match predictions — 1X2, correct score, over/under 2.5 goals, and both-teams-to-score —
        across a growing set of leagues, and we track our own accuracy in public.
      </p>

      <p>
        There&apos;s no login, no paywall, and no paid &quot;VIP tips&quot; tier. The site is
        funded by display advertising and, where clearly labelled, bookmaker affiliate links —
        never by selling picks.
      </p>

      <p>
        See <a href="/how-it-works" className="underline">how predictions are made</a> for the
        statistical model behind the numbers, and our <a href="/accuracy" className="underline">
        accuracy record</a> for how it&apos;s actually performing.
      </p>

      <p>
        ScorelineIQ is a new, independently run site. Questions or feedback are welcome — this
        page will carry contact details once they&apos;re set up.
      </p>
    </article>
  );
}
