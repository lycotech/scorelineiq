import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data ScorelineIQ collects and how it's used.",
};

export default function PrivacyPage() {
  return (
    <article className="flex max-w-2xl flex-col gap-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Privacy policy</h1>

      <p>Last updated: this is an early, pre-launch version of the site and this policy will be reviewed before public launch.</p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">No accounts</h2>
      <p>
        ScorelineIQ has no user accounts, logins, or personal profiles. We don&apos;t ask for or
        store your name, email address, or any personal information to use the site.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Analytics</h2>
      <p>
        Once analytics are enabled, we intend to use privacy-friendly, aggregate-only analytics
        (not full tracking profiles) to understand overall traffic. This section will be updated
        with specifics before that goes live.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Advertising &amp; affiliate links</h2>
      <p>
        When display advertising and bookmaker affiliate links are enabled, the ad and affiliate
        networks we use may set their own cookies and process data under their own privacy
        policies. We&apos;ll link to those networks&apos; privacy policies from here once they&apos;re
        integrated.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Server logs</h2>
      <p>
        Like virtually all websites, our hosting infrastructure may log standard technical
        information (IP address, browser type, pages requested) for security and reliability
        purposes.
      </p>

      <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">Changes to this policy</h2>
      <p>
        This policy will be updated as features (analytics, ads, affiliate links) are actually
        turned on, and a proper legal review will happen before the site takes on real traffic.
      </p>
    </article>
  );
}
