import { FixtureStatus } from "@scorelineiq/db";

const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";

const KNOWN_STATUSES: Record<string, FixtureStatus> = {
  SCHEDULED: FixtureStatus.SCHEDULED,
  TIMED: FixtureStatus.SCHEDULED,
  IN_PLAY: FixtureStatus.LIVE,
  PAUSED: FixtureStatus.LIVE,
  FINISHED: FixtureStatus.FINISHED,
  AWARDED: FixtureStatus.FINISHED,
  POSTPONED: FixtureStatus.POSTPONED,
  SUSPENDED: FixtureStatus.CANCELLED,
  CANCELLED: FixtureStatus.CANCELLED,
};

export interface FootballDataTeam {
  id: number;
  name: string;
}

export interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  area: { name: string };
  competition: { id: number; name: string };
  homeTeam: FootballDataTeam | null;
  awayTeam: FootballDataTeam | null;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

interface FootballDataMatchesResponse {
  matches: FootballDataMatch[];
}

export function mapStatus(rawStatus: string, fixtureExternalId: number): FixtureStatus {
  const mapped = KNOWN_STATUSES[rawStatus];
  if (!mapped) {
    console.warn(
      `[football-data] unrecognized status "${rawStatus}" for fixture ${fixtureExternalId}, defaulting to SCHEDULED`,
    );
    return FixtureStatus.SCHEDULED;
  }
  return mapped;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function fetchMatches(
  dateFrom: string,
  dateTo: string,
): Promise<FootballDataMatch[]> {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not set");
  }

  const url = `${FOOTBALL_DATA_BASE_URL}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
  const response = await fetch(url, {
    headers: { "X-Auth-Token": token },
  });

  if (!response.ok) {
    throw new Error(
      `Football-Data.org request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as FootballDataMatchesResponse;
  return data.matches;
}
