// Supplementary live-score feed from a separate provider (RapidAPI's
// "free-football-api-data", a Sofascore-data mirror) — deliberately
// kept independent of the Football-Data.org-based prediction pipeline.
// Its team/league IDs are a completely different numbering scheme, it
// has no standings/season-stats endpoint our model could use, and its
// per-match detail endpoints are paywalled on the free tier (only the
// current-live list endpoint is available) — so this is a display-only
// "what's happening right now" widget, never a source for predictions.
const HOST = "free-football-api-data.p.rapidapi.com";

export interface LiveMatch {
  id: number;
  home: { name: string; score: number };
  away: { name: string; score: number };
  finished: boolean;
}

function parseMatch(raw: unknown): LiveMatch | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  const home = m.home as Record<string, unknown> | undefined;
  const away = m.away as Record<string, unknown> | undefined;
  const status = m.status as Record<string, unknown> | undefined;

  if (
    typeof m.id !== "number" ||
    typeof home?.name !== "string" ||
    typeof home?.score !== "number" ||
    typeof away?.name !== "string" ||
    typeof away?.score !== "number"
  ) {
    return null;
  }

  return {
    id: m.id,
    home: { name: home.name, score: home.score },
    away: { name: away.name, score: away.score },
    finished: status?.finished === true,
  };
}

// Cached via Next's fetch cache (revalidate: 60) so homepage traffic
// never translates 1:1 into RapidAPI calls — at most one real request
// per minute regardless of visitor count, comfortably inside the
// 500,000/month quota on this particular subscription.
export async function getLiveMatches(): Promise<LiveMatch[]> {
  const key = process.env.RAPIDAPI_FOOTBALL_STATS_KEY;
  if (!key) return [];

  try {
    const response = await fetch(`https://${HOST}/football-current-live`, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": HOST },
      next: { revalidate: 60 },
    });
    if (!response.ok) return [];

    const data = (await response.json()) as { status?: string; response?: { live?: unknown[] } };
    if (data.status !== "success") return [];

    const rawMatches = data.response?.live ?? [];
    return rawMatches.map(parseMatch).filter((m): m is LiveMatch => m !== null);
  } catch (error) {
    console.error("[livescore] failed to fetch live matches:", error);
    return [];
  }
}
