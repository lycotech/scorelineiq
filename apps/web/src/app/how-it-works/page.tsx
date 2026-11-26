import type { Metadata } from "next";

const HOW_IT_WORKS_TITLE = "How football predictions are made — ScorelineIQ methodology";
const HOW_IT_WORKS_DESCRIPTION =
  "A plain-language explanation of the Poisson, Dixon-Coles and Elo statistical model behind ScorelineIQ's football match predictions — 1X2, correct score, over/under 2.5 and BTTS.";

export const metadata: Metadata = {
  title: HOW_IT_WORKS_TITLE,
  description: HOW_IT_WORKS_DESCRIPTION,
  alternates: { canonical: "/how-it-works" },
  openGraph: { title: HOW_IT_WORKS_TITLE, description: HOW_IT_WORKS_DESCRIPTION },
  twitter: { card: "summary_large_image", title: HOW_IT_WORKS_TITLE, description: HOW_IT_WORKS_DESCRIPTION },
};

export default function HowItWorksPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-5 text-sm leading-relaxed text-zinc-700">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
        How predictions are made
      </h1>

      <p>
        ScorelineIQ&apos;s predictions come from a statistical model, not from tipsters or
        insider knowledge. The model is built on published, peer-reviewed statistical research and
        runs fully automatically — generating predictions for every upcoming fixture in our tracked
        leagues before kickoff each day, without any human editorial intervention.
      </p>

      <p>
        Below is a plain-language walkthrough of how it works, what each output means, and where
        the current limitations lie.
      </p>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">Step 1 — Building a goal expectation for each team</h2>
        <p>
          The first thing the model does is estimate how many goals each team is likely to score and
          concede in a given match. It does this by looking at each team&apos;s actual goals scored
          and conceded in the current season, then normalising those figures against the league
          average attack and defence. A team that scores at twice the league average rate gets a
          correspondingly higher expected-goals figure; a team that scores well below average gets a
          lower one.
        </p>
        <p>
          Home advantage is applied as a fixed multiplier — historically, home teams score
          meaningfully more goals than they would on a neutral ground, and the model accounts for
          this. The resulting numbers — expected goals for each team in this specific fixture — are
          the foundation everything else is built on.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">Step 2 — Mapping expected goals to scoreline probabilities (Poisson + Dixon-Coles)</h2>
        <p>
          Once we have each team&apos;s expected goals, we use the Poisson distribution to calculate
          the probability of every realistic scoreline. The Poisson distribution is a standard
          statistical tool for counting events that happen independently at a known average rate —
          and goals in football fit that pattern reasonably well. The model calculates the probability
          of 0 goals, 1 goal, 2 goals, and so on for each team, up to a sensible maximum, then
          combines those to get the probability of every possible final score (0-0, 1-0, 0-1, 1-1,
          2-0, and so on).
        </p>
        <p>
          We then apply the{" "}
          <strong>Dixon-Coles correction</strong> — a well-known adjustment from a 1997 paper by
          Mark Dixon and Stuart Coles that addresses a known weakness in the pure Poisson model:
          low-scoring results (0-0, 1-0, 0-1, 1-1) are slightly more correlated than pure Poisson
          predicts. The correction nudges the probabilities of those scorelines to better match
          observed data.
        </p>
        <p>
          Summing the scoreline probabilities gives us the{" "}
          <strong>1X2 market</strong> (home win, draw, or away win), the{" "}
          <strong>over/under 2.5</strong> probability, and the{" "}
          <strong>both-teams-to-score (BTTS)</strong> probability — all as a natural consequence
          of the same underlying calculation, not separate models.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">Step 3 — Elo rating adjustment</h2>
        <p>
          Alongside the goal model, we maintain an{" "}
          <strong>Elo rating</strong> for every team in the system, updated after each result.
          Elo is a well-understood rating framework originally developed for chess and adapted
          widely for football — it rewards wins (more so against stronger opponents) and penalises
          losses, converging over time to a number that reflects a team&apos;s true strength relative
          to others in the same pool.
        </p>
        <p>
          Every team starts at a baseline rating of 1500 at the beginning of their history in our
          system. After each match, the winner gains rating points and the loser loses them, with
          the magnitude depending on the pre-match rating difference. A team that beats a much
          stronger opponent gains more points than one that beats a much weaker one.
        </p>
        <p>
          The Elo-derived win probability and the Poisson/Dixon-Coles probability are then blended
          together — giving a final 1X2 output that reflects both season-to-date goal data and
          result-based team strength. When both methods agree, the signal is strong. When they
          disagree, the blended output is more cautious.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">What each output means</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong>1X2 probabilities</strong> — the model&apos;s estimate of the chance of a home
            win, draw, or away win. They sum to 100%. A 60% home-win probability means the model
            thinks the home team wins in 6 out of 10 comparable fixtures — not that it will
            definitely happen.
          </li>
          <li>
            <strong>Predicted correct score</strong> — the single scoreline with the highest
            probability under the model. It is typically a low-scoring result (1-0, 1-1, 2-0) —
            correct scores are individually low-probability even when the model is right about
            the direction.
          </li>
          <li>
            <strong>Over/Under 2.5</strong> — the probability that the match has 3 or more goals
            combined. Over 50% means the model expects a higher-scoring game; under 50% means it
            expects fewer than 3 goals.
          </li>
          <li>
            <strong>BTTS (Both Teams to Score)</strong> — the probability that both teams score at
            least once. High BTTS and low expected goals can coexist when the model thinks the game
            will be close but competitive.
          </li>
          <li>
            <strong>Confidence score</strong> — a composite 0–100 score that reflects how strongly
            the model leans toward one outcome. A high confidence score means the model sees a clear
            favourite; a low one means the match is genuinely open.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">How the accuracy record works</h2>
        <p>
          Every prediction is stored in our database before the match kicks off — it cannot be
          changed retroactively. The night after each match, an automated job pulls the final
          result, compares it to the stored prediction, and marks each market as a hit or a miss.
          Those results are rolled into the{" "}
          <a href="/accuracy" className="underline">
            public accuracy record
          </a>
          , broken down by market and by league.
        </p>
        <p>
          There is no cherry-picking and no delayed scoring. The accuracy numbers you see reflect
          the model&apos;s real performance on every match it has covered since the site went live.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">Current limitations</h2>
        <p>
          We document these openly rather than burying them:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong>Season-to-date stats only.</strong> The goal model currently uses totals from
            the current season rather than a multi-season rolling window. Early in a season, when
            few matches have been played, these figures are noisy and the model is less reliable.
          </li>
          <li>
            <strong>No injury or lineup data.</strong> The model has no knowledge of missing
            players, suspensions, or rotated squads — information that can significantly affect
            a match. This is a data availability limitation we intend to address in a future
            version.
          </li>
          <li>
            <strong>No live match data.</strong> Predictions are generated once per day, before
            kickoff. They are not updated during the match.
          </li>
          <li>
            <strong>Limited league history.</strong> Teams that have recently joined a league, or
            leagues that we have only recently started tracking, have less historical data for the
            Elo ratings to converge on. Early-season and newly tracked teams carry more uncertainty.
          </li>
        </ul>
        <p>
          We will update this page as the model evolves. If you have questions or feedback on the
          methodology,{" "}
          <a href="/contact" className="underline">
            get in touch
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-950">This is not betting advice</h2>
        <p>
          Everything on ScorelineIQ is statistical analysis. Probabilities are not certainties.
          Football is inherently unpredictable — that is part of what makes it compelling to watch.
          Nothing here should be taken as a recommendation to place a bet. See our{" "}
          <a href="/responsible-gambling" className="underline">
            responsible gambling
          </a>{" "}
          page if gambling is a concern.
        </p>
      </section>
    </article>
  );
}
