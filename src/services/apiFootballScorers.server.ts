import type { Competition } from "@/types/football";

type ProviderTeam = { team?: { id?: number; name?: string } };
type ProviderPlayer = {
  player?: { id?: number; name?: string; photo?: string };
  statistics?: Array<{
    games?: { appearances?: number | null; minutes?: number | null; position?: string | null };
    goals?: { total?: number | null; penalty?: number | null };
  }>;
};
type ProviderResponse<T> = { response?: T[]; errors?: Record<string, string> };

export interface ScorerProjection {
  playerId: number;
  name: string;
  photoUrl?: string;
  teamName: string;
  anytimeProbability: number;
  goals: number;
  appearances: number;
  minutes: number;
}

const LEAGUE_IDS: Record<Competition, number> = {
  "Premier League": 39,
  "Champions League": 2,
};
const SEASON = Number(process.env.FOOTBALL_SEASON ?? new Date().getUTCFullYear());
const BASE_URL = "https://v3.football.api-sports.io";
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();

async function providerGet<T>(path: string): Promise<ProviderResponse<T>> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("SCORER_DATA_NOT_CONFIGURED");

  const cached = responseCache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.value as ProviderResponse<T>;

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`SCORER_PROVIDER_HTTP_${response.status}`);
  const payload = (await response.json()) as ProviderResponse<T>;
  if (payload.errors && Object.keys(payload.errors).length > 0) {
    const errorKeys = Object.keys(payload.errors).join(",").slice(0, 80);
    throw new Error(`SCORER_PROVIDER_API_${errorKeys || "UNKNOWN"}:${path}`);
  }
  responseCache.set(path, { expiresAt: Date.now() + 30 * 60 * 1000, value: payload });
  return payload;
}

async function resolveTeamId(name: string, leagueId: number): Promise<number | undefined> {
  const query = new URLSearchParams({
    league: String(leagueId),
    season: String(SEASON),
    search: name,
  });
  const teams = await providerGet<ProviderTeam>(`/teams?${query.toString()}`);
  const normalized = name.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
  const exact = teams.response?.find((item) => {
    const candidate = item.team?.name?.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
    return candidate === normalized;
  });
  return exact?.team?.id;
}

async function getTeamPlayers(teamId: number): Promise<ProviderPlayer[]> {
  const query = new URLSearchParams({ team: String(teamId), season: String(SEASON), page: "1" });
  const firstPage = await providerGet<ProviderPlayer>(`/players?${query.toString()}`);
  const players = [...(firstPage.response ?? [])];
  // API-Football caps a page at 20 player rows. Pull additional pages where needed.
  const pages = Number(
    (firstPage as ProviderResponse<ProviderPlayer> & { paging?: { total?: number } }).paging
      ?.total ?? 1,
  );
  const nextPages = await Promise.all(
    Array.from({ length: Math.max(0, Math.min(pages, 5) - 1) }, (_, index) => {
      const nextQuery = new URLSearchParams(query);
      nextQuery.set("page", String(index + 2));
      return providerGet<ProviderPlayer>(`/players?${nextQuery.toString()}`);
    }),
  );
  nextPages.forEach((page) => players.push(...(page.response ?? [])));
  return players;
}

function projectTeamScorers(
  players: ProviderPlayer[],
  teamName: string,
  expectedGoals: number,
): ScorerProjection[] {
  const candidates = players.flatMap((entry) => {
    const player = entry.player;
    const season = entry.statistics?.[0];
    const appearances = season?.games?.appearances ?? 0;
    const minutes = season?.games?.minutes ?? 0;
    const goals = season?.goals?.total ?? 0;
    if (!player?.id || !player.name || appearances < 3 || minutes < 90 || goals < 1) return [];
    return [
      {
        playerId: player.id,
        name: player.name,
        ...(player.photo ? { photoUrl: player.photo } : {}),
        teamName,
        goals,
        appearances,
        minutes,
        scoringRate: goals / minutes,
      },
    ];
  });

  const totalRate = candidates.reduce((sum, player) => sum + player.scoringRate, 0);
  if (!totalRate) return [];
  return candidates
    .map(({ scoringRate, ...player }) => {
      const playerGoals = expectedGoals * (scoringRate / totalRate);
      return {
        ...player,
        anytimeProbability: 1 - Math.exp(-playerGoals),
      };
    })
    .sort((a, b) => b.anytimeProbability - a.anytimeProbability)
    .slice(0, 3);
}

export async function getScorerProjections(input: {
  homeName: string;
  awayName: string;
  competition: Competition;
  homeExpectedGoals: number;
  awayExpectedGoals: number;
}): Promise<ScorerProjection[]> {
  const leagueId = LEAGUE_IDS[input.competition];
  const [homeId, awayId] = await Promise.all([
    resolveTeamId(input.homeName, leagueId),
    resolveTeamId(input.awayName, leagueId),
  ]);
  if (!homeId || !awayId) return [];
  const [homePlayers, awayPlayers] = await Promise.all([
    getTeamPlayers(homeId),
    getTeamPlayers(awayId),
  ]);
  return [
    ...projectTeamScorers(homePlayers, input.homeName, input.homeExpectedGoals),
    ...projectTeamScorers(awayPlayers, input.awayName, input.awayExpectedGoals),
  ];
}
