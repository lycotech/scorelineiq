import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How predictions are made",
  description: "The statistical model behind ScorelineIQ's football predictions, explained in plain language.",
};

export default function HowItWorksPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        How predictions are made
      </h1>

      <p>
        ScorelineIQ&apos;s predictions come from a statistical model, not from tipsters or
        insider information. Here&apos;s the plain-language version of how it works.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">1. Expected goals</h2>
      <p>
        For each match, we estimate how many goals each team is likely to score based on their
        actual goals scored and conceded so far this season, compared against the league average.
        A team that scores more than average and concedes less gets a higher expected-goals number;
        a struggling team gets a lower one.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">2. A Poisson goal model</h2>
      <p>
        Goals in football follow a pattern statisticians call a Poisson distribution reasonably
        well. Once we have each team&apos;s expected goals, we use this to calculate the
        probability of every realistic scoreline (0-0, 1-0, 2-1, and so on), then add a small,
        well-documented correction (from published research by Dixon &amp; Coles) that accounts
        for low-scoring games being slightly more correlated than a pure Poisson model assumes.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">3. An Elo strength adjustment</h2>
      <p>
        We also track a simple Elo rating for every team, updated after each result — similar to
        the system used in chess. This gives us a second, independent view of team strength that
        reacts to recent results, and we blend it with the goal-based probabilities above.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">4. Published transparently</h2>
      <p>
        Every prediction we publish is scored against the final result and rolled into our{" "}
        <a href="/accuracy" className="underline">
          public accuracy record
        </a>{" "}
        — including the ones we get wrong. We don&apos;t remove or hide bad predictions.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">What this isn&apos;t</h2>
      <p>
        This is statistical analysis, not betting advice, and not a guarantee of any outcome.
        Football is unpredictable — that&apos;s a large part of what makes it worth watching. See
        our{" "}
        <a href="/responsible-gambling" className="underline">
          responsible gambling
        </a>{" "}
        page for more.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Current limitations</h2>
      <p>
        The model is early-stage. It currently uses season-to-date team stats rather than a full
        multi-season statistical fit, and our own historical match database is still small — both
        will improve as more results accumulate. We&apos;d rather be upfront about that than
        overstate what the numbers mean.
      </p>
    </article>
  );
}
