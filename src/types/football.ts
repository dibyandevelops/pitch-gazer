/** Domain types shared by the data layer, prediction engine and UI. */

export type MatchResult = "W" | "D" | "L";
export type Competition = "Premier League" | "Champions League";

export interface UpcomingFixture {
  id: string;
  competition: Competition;
  round: string;
  /** Kickoff expressed in UTC so the UI can format it for the viewer. */
  kickoff: string;
  homeId: string;
  awayId: string;
}

export interface TeamColors {
  /** Primary shirt colour, hex. */
  primary: string;
  /** Secondary / trim colour, hex. */
  secondary: string;
}

export interface TeamStats {
  /** Goals scored per match, season to date. */
  goalsForPerGame: number;
  /** Goals conceded per match, season to date. */
  goalsAgainstPerGame: number;
  /** Expected goals created per match. */
  xgForPerGame: number;
  /** Expected goals allowed per match. */
  xgAgainstPerGame: number;
  /** Share of possession, 0..1. */
  possession: number;
  /** Share of attacks down the left / centre / right, sums to 1. */
  attackZones: [left: number, center: number, right: number];
  /** Defensive solidity per third (0..1, higher = tighter). */
  defenseZones: [left: number, center: number, right: number];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  /** Club crest image URL from football-data.org's public crest CDN. */
  crestUrl?: string;
  league: string;
  /** Competitions this club is part of this season, when known. */
  competitions?: Competition[];
  colors: TeamColors;
  /** Most recent five results, oldest first. */
  form: MatchResult[];
  stats: TeamStats;
}

export interface HeadToHead {
  /** Sorted team ids joined by "__" so lookups are order independent. */
  key: string;
  homeWins: number;
  draws: number;
  awayWins: number;
  /** Average total goals in recent meetings. */
  avgGoals: number;
}

/** Everything the prediction engine needs for one fixture. */
export interface FixtureInput {
  home: Team;
  away: Team;
  headToHead?: HeadToHead;
  /** Multiplier applied to the home side's expected goals. */
  homeAdvantage?: number;
}

export interface Scoreline {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

export type Confidence = "low" | "medium" | "high";

export interface Prediction {
  homeWin: number;
  draw: number;
  awayWin: number;
  expectedGoals: { home: number; away: number };
  mostLikely: Scoreline;
  topScorelines: Scoreline[];
  confidence: Confidence;
  /** 0..100 — how clearly one outcome stands out. */
  confidenceScore: number;
  /** Probability both teams score at least once. */
  btts: number;
  /** Probability of 3+ total goals. */
  over25: number;
  /** Fair odds = 1 / probability. Informational only, not betting advice. */
  fairOdds: { home: number; draw: number; away: number };
  /** Full scoreline probability grid, [homeGoals][awayGoals]. */
  matrix: number[][];
  /** Plain-language reasoning shown in the results panel. */
  rationale: string[];
}
