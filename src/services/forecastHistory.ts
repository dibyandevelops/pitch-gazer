import type { Prediction, Team } from "@/types/football";

const STORAGE_KEY = "pitchoracle-ai:recent-forecasts:v1";
const MAX_FORECASTS = 6;

export interface RecentForecast {
  id: string;
  createdAt: string;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeShortName: string;
  awayShortName: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  homeGoals: number;
  awayGoals: number;
  confidence: number;
  prediction: Prediction;
}

function canUseStorage() {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function getRecentForecasts(): RecentForecast[] {
  if (!canUseStorage()) return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    const forecasts = deduplicateForecasts(value.filter(isRecentForecast));
    // Clean up repeated matchup entries saved by earlier versions of the app.
    if (forecasts.length !== value.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(forecasts));
    }
    return forecasts;
  } catch {
    return [];
  }
}

export function saveRecentForecast(home: Team, away: Team, prediction: Prediction) {
  if (!canUseStorage()) return;
  const entry: RecentForecast = {
    id: `${home.id}-${away.id}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    homeId: home.id,
    awayId: away.id,
    homeName: home.name,
    awayName: away.name,
    homeShortName: home.shortName,
    awayShortName: away.shortName,
    homeWin: prediction.homeWin,
    draw: prediction.draw,
    awayWin: prediction.awayWin,
    homeGoals: prediction.mostLikely.homeGoals,
    awayGoals: prediction.mostLikely.awayGoals,
    confidence: prediction.confidenceScore,
    prediction,
  };
  try {
    const sameMatchup = (forecast: RecentForecast) =>
      forecast.homeId === home.id && forecast.awayId === away.id;
    const history = [entry, ...getRecentForecasts().filter((forecast) => !sameMatchup(forecast))];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_FORECASTS)));
  } catch {
    // Forecasting remains available when browser storage is disabled or full.
  }
}

function deduplicateForecasts(forecasts: RecentForecast[]): RecentForecast[] {
  const seen = new Set<string>();
  return [...forecasts]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .filter((forecast) => {
      const matchup = `${forecast.homeId}:${forecast.awayId}`;
      if (seen.has(matchup)) return false;
      seen.add(matchup);
      return true;
    })
    .slice(0, MAX_FORECASTS);
}

function isRecentForecast(value: unknown): value is RecentForecast {
  if (!value || typeof value !== "object") return false;
  const forecast = value as Partial<RecentForecast>;
  return (
    typeof forecast.id === "string" &&
    typeof forecast.createdAt === "string" &&
    typeof forecast.homeId === "string" &&
    typeof forecast.awayId === "string" &&
    typeof forecast.homeName === "string" &&
    typeof forecast.awayName === "string" &&
    typeof forecast.homeShortName === "string" &&
    typeof forecast.awayShortName === "string" &&
    typeof forecast.prediction === "object" &&
    [
      forecast.homeWin,
      forecast.draw,
      forecast.awayWin,
      forecast.homeGoals,
      forecast.awayGoals,
      forecast.confidence,
    ].every((number) => typeof number === "number" && Number.isFinite(number))
  );
}
