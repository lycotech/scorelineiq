import { NextRequest, NextResponse } from "next/server";
import { prisma, FixtureStatus } from "@scorelineiq/db";
import { slugify } from "../../../../../lib/slugify";
import { formatDate } from "../../../../../lib/football-data";
import { getPublicOrigin } from "../../../../../lib/request-origin";

export async function POST(request: NextRequest) {
  const origin = getPublicOrigin(request);

  try {
    const formData = await request.formData();
    const fixtureExternalId = String(formData.get("fixtureExternalId") ?? "");
    const kickoffAt = String(formData.get("kickoffAt") ?? "");
    const homeTeamExternalId = String(formData.get("homeTeamExternalId") ?? "");
    const homeTeamName = String(formData.get("homeTeamName") ?? "");
    const awayTeamExternalId = String(formData.get("awayTeamExternalId") ?? "");
    const awayTeamName = String(formData.get("awayTeamName") ?? "");
    const leagueExternalId = String(formData.get("leagueExternalId") ?? "");
    const leagueName = String(formData.get("leagueName") ?? `League #${leagueExternalId}`);

    if (!fixtureExternalId || !homeTeamExternalId || !awayTeamExternalId || !leagueExternalId || !kickoffAt) {
      throw new Error("Missing required fixture fields");
    }

    const league = await prisma.league.upsert({
      where: { externalId: `rapidapi:${leagueExternalId}` },
      create: {
        externalId: `rapidapi:${leagueExternalId}`,
        name: leagueName,
        slug: slugify(leagueName),
        country: "Unknown",
      },
      // Never overwrite a name an admin already gave this league on a
      // later import from the same source.
      update: {},
    });

    const homeTeam = await prisma.team.upsert({
      where: { externalId: `rapidapi:${homeTeamExternalId}` },
      create: {
        externalId: `rapidapi:${homeTeamExternalId}`,
        name: homeTeamName,
        slug: slugify(homeTeamName),
        leagueId: league.id,
      },
      update: {},
    });

    const awayTeam = await prisma.team.upsert({
      where: { externalId: `rapidapi:${awayTeamExternalId}` },
      create: {
        externalId: `rapidapi:${awayTeamExternalId}`,
        name: awayTeamName,
        slug: slugify(awayTeamName),
        leagueId: league.id,
      },
      update: {},
    });

    const kickoffDate = new Date(kickoffAt);
    const slug = `${homeTeam.slug}-vs-${awayTeam.slug}-${formatDate(kickoffDate)}`;

    const fixture = await prisma.fixture.upsert({
      where: { externalId: `rapidapi:${fixtureExternalId}` },
      create: {
        externalId: `rapidapi:${fixtureExternalId}`,
        slug,
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoffAt: kickoffDate,
        status: FixtureStatus.SCHEDULED,
      },
      update: {},
    });

    const redirectUrl = new URL(`/admin/fixture/${fixture.id}`, origin);
    redirectUrl.searchParams.set("result", "imported");
    return NextResponse.redirect(redirectUrl, 303);
  } catch (error) {
    const redirectUrl = new URL("/admin/external-fixtures", origin);
    redirectUrl.searchParams.set("result", "error");
    redirectUrl.searchParams.set("reason", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.redirect(redirectUrl, 303);
  }
}
