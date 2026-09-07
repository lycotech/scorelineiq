import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responsible gambling",
  description: "ScorelineIQ publishes statistical analysis, not betting advice. If gambling is affecting you, help is available.",
};

export default function ResponsibleGamblingPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Responsible gambling
      </h1>

      <p>
        ScorelineIQ publishes statistical analysis of football matches. It is not betting advice,
        it does not guarantee any outcome, and nothing on this site should be treated as a
        recommendation to place a bet.
      </p>

      <p>
        Any bookmaker links on this site are clearly labelled as affiliate links and are entirely
        separate from our prediction content — we don&apos;t adjust predictions to favor any
        bookmaker or outcome.
      </p>

      <p>
        If gambling stops being fun, or is affecting your finances, relationships, or wellbeing,
        support is available. Depending on where you are, organizations like{" "}
        <a href="https://www.begambleaware.org" className="underline" rel="noopener noreferrer" target="_blank">
          BeGambleAware
        </a>{" "}
        (UK), the{" "}
        <a href="https://www.ncpgambling.org" className="underline" rel="noopener noreferrer" target="_blank">
          National Council on Problem Gambling
        </a>{" "}
        (US), or your national health service can help. Please only bet what you can afford to
        lose, and never chase losses.
      </p>

      <p>This site is not intended for use by anyone under the legal gambling age in their jurisdiction.</p>
    </article>
  );
}
