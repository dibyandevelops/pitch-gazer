import type { Competition } from "@/types/football";

export interface LiveMatch {
  id: number;
  competition: Competition;
  round: string;
  kickoff: string;
  elapsed: number | null;
  addedTime: number | null;
  status: string;
  venue?: string;
  home: { name: string; crest?: string; goals: number | null };
  away: { name: string; crest?: string; goals: number | null };
}

interface ApiFixture {
  fixture?: {
    id?: number;
    date?: string;
    status?: { short?: string; elapsed?: number | null; extra?: number | null };
    venue?: { name?: string | null };
  };
  league?: { id?: number; name?: string; round?: string };
  teams?: {
    home?: { name?: string; logo?: string };
    away?: { name?: string; logo?: string };
  };
  goals?: { home?: number | null; away?: number | null };
}

interface ApiResponse<T> {
  response?: T[];
  errors?: Record<string, string>;
}

const LIVE_LEAGUES: Record<number, Competition> = {
  39: "Premier League",
  2: "Champions League",
};

export async function getLiveMatches(): Promise<LiveMatch[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("LIVE_DATA_NOT_CONFIGURED");

  const response = await fetch(`${"https://v3.football.api-sports.io"}/fixtures?live=39-2`, {
    headers: { "x-apisports-key": apiKey },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`LIVE_PROVIDER_HTTP_${response.status}`);

  const payload = (await response.json()) as ApiResponse<ApiFixture>;
  if (payload.errors && Object.keys(payload.errors).length > 0) {
    const keys = Object.keys(payload.errors).join(",").slice(0, 80);
    throw new Error(`LIVE_PROVIDER_API_${keys || "UNKNOWN"}`);
  }

  return (payload.response ?? [])
    .flatMap((row) => {
      const fixture = row.fixture;
      const league = row.league;
      const home = row.teams?.home;
      const away = row.teams?.away;
      const competition = league?.id ? LIVE_LEAGUES[league.id] : undefined;
      if (!fixture?.id || !fixture.date || !competition || !home?.name || !away?.name) return [];

      return [
        {
          id: fixture.id,
          competition,
          round: league.round ?? "Live match",
          kickoff: fixture.date,
          elapsed: fixture.status?.elapsed ?? null,
          addedTime: fixture.status?.extra ?? null,
          status: fixture.status?.short ?? "LIVE",
          ...(fixture.venue?.name ? { venue: fixture.venue.name } : {}),
          home: {
            name: home.name,
            ...(home.logo ? { crest: home.logo } : {}),
            goals: row.goals?.home ?? null,
          },
          away: {
            name: away.name,
            ...(away.logo ? { crest: away.logo } : {}),
            goals: row.goals?.away ?? null,
          },
        },
      ];
    })
    .sort(
      (a, b) => a.competition.localeCompare(b.competition) || a.kickoff.localeCompare(b.kickoff),
    );
}
