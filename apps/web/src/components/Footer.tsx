import Link from "next/link";
import { getAllLeaguesWithUpcomingCounts } from "../lib/queries";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How predictions are made" },
  { href: "/responsible-gambling", label: "Responsible gambling" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export async function Footer() {
  // League hub pages otherwise have no link to them anywhere in global
  // nav — only reachable via the homepage's "Leagues we track" section
  // or a match page's single breadcrumb entry. Surfacing them here puts
  // every league one click from any page on the site.
  //
  // Footer renders on every page via the root layout, including ones
  // Next statically prerenders at build time (/about, /privacy,
  // /_not-found, ...) — no live database is reachable from inside the
  // Docker build (see src/app/page.tsx's comment on the same
  // constraint), which would otherwise fail the build outright. Falls
  // back to no league links rather than crashing; real traffic hits
  // this on dynamic/revalidated pages, where the DB is reachable and
  // the list renders normally.
  let leaguesWithFixtures: Awaited<ReturnType<typeof getAllLeaguesWithUpcomingCounts>> = [];
  try {
    const leagues = await getAllLeaguesWithUpcomingCounts();
    leaguesWithFixtures = leagues.filter((league) => league._count.fixtures > 0);
  } catch {
    // build-time prerender with no DB reachable — see comment above.
  }

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        {leaguesWithFixtures.length > 0 && (
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-tertiary">
            {leaguesWithFixtures.map((league) => (
              <Link key={league.id} href={`/league/${league.slug}`} className="hover:text-primary">
                {league.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-tertiary">
            &copy; {new Date().getFullYear()} ScorelineIQ. Statistical analysis, not betting advice.
          </p>
          <nav className="flex flex-wrap gap-4 text-sm text-tertiary">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
