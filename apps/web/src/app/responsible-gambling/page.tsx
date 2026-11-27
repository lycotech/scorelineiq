import Link from "next/link";
import type { Metadata } from "next";
import { SITE_INFO } from "../../lib/site-info";

const DESCRIPTION = `ScorelineIQ publishes statistical football analysis, not betting advice, and is for adults aged ${SITE_INFO.minimumAge} and over. Tips for staying in control and where to find help in Nigeria.`;

export const metadata: Metadata = {
  title: "Responsible gambling",
  description: DESCRIPTION,
  alternates: { canonical: "/responsible-gambling" },
};

const H2 = "text-base font-semibold text-zinc-950";

export default function ResponsibleGamblingPage() {
  const { operatorName, operatorLocation, contactEmail, minimumAge } = SITE_INFO;

  return (
    <article className="flex max-w-2xl flex-col gap-4 text-sm leading-relaxed text-zinc-700">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Responsible gambling</h1>

      <p className="rounded-lg border border-border bg-surface p-4 font-medium text-zinc-900">
        You must be {minimumAge} or over to gamble in Nigeria. If you are under {minimumAge}, please
        do not use any bookmaker or betting site, and do not follow links to them from here.
      </p>

      <h2 className={H2}>What ScorelineIQ is — and isn&apos;t</h2>
      <p>
        ScorelineIQ publishes statistical analysis of football matches. We do not take bets, we are
        not a bookmaker, and we never ask you for money to see a prediction. Nothing on this site is
        betting advice, a tip, or a recommendation to place a bet.
      </p>
      <p>
        Every figure is a probability, not a promise. A forecast of 60% means the model expects that
        result to happen about six times in ten similar matches — and four times in ten it
        won&apos;t. Football is unpredictable, our model will often be wrong, and we publish our
        full{" "}
        <Link href="/accuracy" className="underline">
          accuracy record
        </Link>{" "}
        so you can see how often. Bookmakers also build a margin into their odds, so even accurate
        probabilities do not mean a profit.
      </p>

      <h2 className={H2}>Affiliate links</h2>
      <p>
        ScorelineIQ is funded by advertising and, where clearly labelled, links to bookmakers for
        which we may earn a commission. These links are separate from our predictions: we do not
        adjust any prediction to favour a bookmaker or an outcome. We can&apos;t check an
        operator&apos;s licence in your state, so make sure any operator you use is licensed to
        operate where you live before you open an account.
      </p>

      <h2 className={H2}>Staying in control</h2>
      <p>If you choose to gamble, these habits help keep it entertainment and nothing more:</p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        <li>Only stake money you can afford to lose. Never use rent, school fees, food, transport, business or savings money.</li>
        <li>Decide your limit — time and money — before you start, and stick to it.</li>
        <li>Never chase losses. A loss does not make the next result more likely to go your way.</li>
        <li>Never borrow money, or use loans or credit, to gamble.</li>
        <li>Don&apos;t gamble when you are upset, stressed, tired or have been drinking.</li>
        <li>Take regular breaks, and keep a record of what you spend.</li>
        <li>Use the deposit limits, time-outs and self-exclusion tools that reputable operators provide.</li>
      </ul>

      <h2 className={H2}>Signs gambling may be becoming a problem</h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        <li>Gambling more than you planned, or for longer than you meant to.</li>
        <li>Needing to stake more to get the same excitement.</li>
        <li>Chasing losses or gambling to win back money.</li>
        <li>Borrowing, selling things or hiding gambling from family and friends.</li>
        <li>Feeling anxious, guilty or irritable when you try to cut down.</li>
        <li>Neglecting work, studies or family because of gambling.</li>
      </ul>

      <h2 className={H2}>Where to get help in Nigeria</h2>
      <p>
        If gambling is affecting your money, relationships or wellbeing, you are not alone and help
        is available. You can:
      </p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        <li>
          Contact{" "}
          <a href="https://gamblealert.org" className="underline" rel="noopener noreferrer" target="_blank">
            Gamble Alert
          </a>
          , an independent non-profit that offers support to people affected by gambling in Nigeria.
        </li>
        <li>
          Use the free online support and self-help tools at{" "}
          <a href="https://www.gamblingtherapy.org" className="underline" rel="noopener noreferrer" target="_blank">
            Gambling Therapy
          </a>
          , which is available worldwide.
        </li>
        <li>Talk to someone you trust — a friend, family member, faith leader or colleague.</li>
        <li>Speak to a doctor or a mental-health professional, especially if you feel low or hopeless.</li>
      </ul>
      <p>
        If you are in crisis or thinking about harming yourself, contact your local emergency
        services or go to the nearest hospital straight away.
      </p>

      <h2 className={H2}>Parents and guardians</h2>
      <p>
        Under-{minimumAge}s should never gamble. You can help by keeping betting accounts and
        payment cards out of children&apos;s reach, using parental controls and content filters on
        shared devices, and talking openly with young people about how gambling works and its risks.
      </p>

      <h2 className={H2}>Who runs this site</h2>
      <p>
        {operatorName ? (
          <>
            ScorelineIQ is operated by {operatorName}
            {operatorLocation ? `, ${operatorLocation}` : ""}.{" "}
          </>
        ) : null}
        Questions or concerns about this page? Email{" "}
        <a href={`mailto:${contactEmail}`} className="underline">
          {contactEmail}
        </a>{" "}
        or see our{" "}
        <Link href="/contact" className="underline">
          contact page
        </Link>
        .
      </p>
    </article>
  );
}
