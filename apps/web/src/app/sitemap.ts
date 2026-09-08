import type { MetadataRoute } from "next";
import { getAllFixtureSlugsForSitemap, getAllLeagueSlugsForSitemap } from "../lib/queries";
import { toDateParam } from "../lib/format";

// A single sitemap file is enough at current volume (dozens of URLs).
// Next.js supports generateSitemaps() to split into multiple files once
// this approaches the ~50k-URL-per-file limit search engines expect —
// revisit once real fixture volume (per docs/IMPLEMENTATION_PLAN.md's
// "30-40 games/day" target) makes that necessary.
//
// Rendered per-request rather than at build time — see
// src/app/page.tsx for why (no live database reachable from inside the
// Docker build).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL ?? "https://scorelineiq.com";

  const [fixtures, leagues] = await Promise.all([
    getAllFixtureSlugsForSitemap(),
    getAllLeagueSlugsForSitemap(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/accuracy`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/responsible-gambling`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const leagueRoutes: MetadataRoute.Sitemap = leagues.map((league) => ({
    url: `${baseUrl}/league/${league.slug}`,
    lastModified: league.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const matchRoutes: MetadataRoute.Sitemap = fixtures.map((fixture) => ({
    url: `${baseUrl}/match/${fixture.slug}`,
    lastModified: fixture.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const dayArchiveDates = [...new Set(fixtures.map((f) => toDateParam(f.kickoffAt)))];
  const dayArchiveRoutes: MetadataRoute.Sitemap = dayArchiveDates.map((date) => ({
    url: `${baseUrl}/predictions/${date}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...leagueRoutes, ...matchRoutes, ...dayArchiveRoutes];
}
