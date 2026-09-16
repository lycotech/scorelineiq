// A second, supplementary fixture source (RapidAPI's Sofascore-data
// mirror) covering ~150+ leagues Football-Data.org's free tier
// doesn't. Deliberately NOT auto-ingested into the main pipeline:
// this subscription is capped at 100 requests/month, has no
// standings endpoint (so we could never generate real predictions
// for these teams), and its league IDs don't resolve to names on our
// tier (that lookup is paywalled) — so admin/external-fixtures lets
// an admin browse the raw list and selectively import specific
// fixtures, naming the league themselves at import time, then
// predicting them manually via the existing admin fixture editor.
const HOST = "free-api-live-football-data.p.rapidapi.com";

export interface ExternalFixture {
  externalId: string;
  leagueExternalId: string;
  kickoffAt: string; // ISO
  homeTeam: { externalId: string; name: string };
  awayTeam: { externalId: string; name: string };
  finished: boolean;
}

function parseMatch(raw: unknown): ExternalFixture | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  const home = m.home as Record<string, unknown> | undefined;
  const away = m.away as Record<string, unknown> | undefined;
  const status = m.status as Record<string, unknown> | undefined;

  if (
    typeof m.id !== "number" ||
    typeof m.leagueId !== "number" ||
    typeof status?.utcTime !== "string" ||
    typeof home?.id !== "number" ||
    typeof home?.name !== "string" ||
    typeof away?.id !== "number" ||
    typeof away?.name !== "string"
  ) {
    return null;
  }

  return {
    externalId: String(m.id),
    leagueExternalId: String(m.leagueId),
    kickoffAt: status.utcTime,
    homeTeam: { externalId: String(home.id), name: home.name },
    awayTeam: { externalId: String(away.id), name: away.name },
    finished: status.finished === true,
  };
}

// date: "YYYYMMDD" (this API's own format, distinct from our usual
// "YYYY-MM-DD" — converted at the call site).
export async function fetchExternalFixtures(date: string): Promise<ExternalFixture[]> {
  const key = process.env.RAPIDAPI_FOOTBALL_STATS_KEY;
  if (!key) return [];

  try {
    const response = await fetch(`https://${HOST}/football-get-matches-by-date?date=${date}`, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": HOST },
      // 30 minutes: this API is capped at 100 requests/month, so
      // repeat admin page views within a window must not each cost a
      // call. Long enough to protect quota, short enough that a
      // deliberate re-check later in the day gets fresh data.
      next: { revalidate: 1800 },
    });
    if (!response.ok) return [];

    const data = (await response.json()) as { status?: string; response?: { matches?: unknown[] } };
    if (data.status !== "success") return [];

    const rawMatches = data.response?.matches ?? [];
    return rawMatches.map(parseMatch).filter((m): m is ExternalFixture => m !== null);
  } catch (error) {
    console.error("[external-fixtures] failed to fetch:", error);
    return [];
  }
}
