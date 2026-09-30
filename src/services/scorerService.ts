import type { Competition } from "@/types/football";
import type { ScorerProjection } from "./apiFootballScorers.server";

export type ScorerForecastResult =
  | { status: "ready"; players: ScorerProjection[] }
  | { status: "not-configured"; players: [] }
  | { status: "plan-limited"; players: [] }
  | { status: "unavailable"; players: [] };

export async function loadScorerForecast(input: {
  homeName: string;
  awayName: string;
  competition: Competition;
  homeExpectedGoals: number;
  awayExpectedGoals: number;
}): Promise<ScorerForecastResult> {
  const query = new URLSearchParams({
    home: input.homeName,
    away: input.awayName,
    competition: input.competition,
    homeXg: String(input.homeExpectedGoals),
    awayXg: String(input.awayExpectedGoals),
  });
  try {
    const response = await fetch(`/api/scorer-predictions?${query.toString()}`);
    if (response.status === 503) return { status: "not-configured", players: [] };
    if (response.status === 402) return { status: "plan-limited", players: [] };
    if (!response.ok) return { status: "unavailable", players: [] };
    const result = (await response.json()) as { players?: ScorerProjection[] };
    return { status: "ready", players: result.players ?? [] };
  } catch {
    return { status: "unavailable", players: [] };
  }
}
