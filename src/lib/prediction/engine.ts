import type {
  Confidence,
  FixtureInput,
  MatchResult,
  Prediction,
  Scoreline,
  Team,
} from "@/types/football";
import { scoreMatrix } from "./poisson";

/** Tunable model constants. */
export const MODEL = {
  LEAGUE_AVG_GOALS: 1.35,
  HOME_ADVANTAGE: 1.12,
  XG_WEIGHT: 0.6,
  FORM_SWING: 0.08,
  H2H_WEIGHT: 0.15,
  MIN_LAMBDA: 0.2,
  MAX_LAMBDA: 4.5,
  RHO: -0.08,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

const blend = (actual: number, xg: number) => actual * (1 - MODEL.XG_WEIGHT) + xg * MODEL.XG_WEIGHT;

export const attackStrength = (t: Team) =>
  blend(t.stats.goalsForPerGame, t.stats.xgForPerGame) / MODEL.LEAGUE_AVG_GOALS;
export const defenseWeakness = (t: Team) =>
  blend(t.stats.goalsAgainstPerGame, t.stats.xgAgainstPerGame) / MODEL.LEAGUE_AVG_GOALS;

/** Form as -1..1 (all losses .. all wins), recent games weighted more. */
export function formIndex(form: MatchResult[]): number {
  if (!form.length) return 0;
  let s = 0;
  let w = 0;
  form.forEach((r, i) => {
    const weight = i + 1;
    s += (r === "W" ? 1 : r === "D" ? 0 : -1) * weight;
    w += weight;
  });
  return s / w;
}

export function expectedGoals({ home, away, headToHead, homeAdvantage }: FixtureInput) {
  const adv = homeAdvantage ?? MODEL.HOME_ADVANTAGE;
  let lh = attackStrength(home) * defenseWeakness(away) * MODEL.LEAGUE_AVG_GOALS * adv;
  let la = (attackStrength(away) * defenseWeakness(home) * MODEL.LEAGUE_AVG_GOALS) / Math.sqrt(adv);
  lh *= 1 + formIndex(home.form) * MODEL.FORM_SWING;
  la *= 1 + formIndex(away.form) * MODEL.FORM_SWING;
  if (headToHead && lh + la > 0) {
    const scale = 1 + (headToHead.avgGoals / (lh + la) - 1) * MODEL.H2H_WEIGHT;
    lh *= scale;
    la *= scale;
  }
  return {
    home: clamp(lh, MODEL.MIN_LAMBDA, MODEL.MAX_LAMBDA),
    away: clamp(la, MODEL.MIN_LAMBDA, MODEL.MAX_LAMBDA),
  };
}

function confidenceFrom(probs: number[]): { level: Confidence; score: number } {
  const sorted = [...probs].sort((a, b) => b - a);
  // top prob ranges ~0.34 (coin flip) .. 1; margin over 2nd adds clarity.
  const s0 = sorted[0]!,
    s1 = sorted[1]!;
  const score = clamp(((s0 - 1 / 3) / (2 / 3)) * 70 + (s0 - s1) * 60, 0, 100);
  const level: Confidence = s0 >= 0.6 ? "high" : s0 >= 0.45 ? "medium" : "low";
  return { level, score: Math.round(score) };
}

export function predictMatch(input: FixtureInput): Prediction {
  if (input.home.id === input.away.id) throw new Error("A team cannot play itself");
  const xg = expectedGoals(input);
  const matrix = scoreMatrix(xg.home, xg.away, 10, MODEL.RHO);

  let homeWin = 0,
    draw = 0,
    awayWin = 0,
    over25 = 0,
    noHome = 0,
    noAway = 0;
  const cells: Scoreline[] = [];
  matrix.forEach((row, h) =>
    row.forEach((p, a) => {
      if (h > a) homeWin += p;
      else if (h === a) draw += p;
      else awayWin += p;
      if (h + a >= 3) over25 += p;
      if (h === 0) noHome += p;
      if (a === 0) noAway += p;
      cells.push({ homeGoals: h, awayGoals: a, probability: p });
    }),
  );
  const btts = 1 - noHome - noAway + matrix[0]![0]!;
  cells.sort((x, y) => y.probability - x.probability);
  const top = cells.slice(0, 5).map((c) => ({ ...c, probability: round(c.probability) }));
  const conf = confidenceFrom([homeWin, draw, awayWin]);
  const odds = (p: number) => (p > 0 ? Math.round((1 / p) * 100) / 100 : Infinity);

  const { home, away } = input;
  const rationale: string[] = [];
  const atkDiff = attackStrength(home) - attackStrength(away);
  if (Math.abs(atkDiff) > 0.15)
    rationale.push(
      `${atkDiff > 0 ? home.name : away.name} create more chances per game (xG-weighted).`,
    );
  const fh = formIndex(home.form),
    fa = formIndex(away.form);
  if (Math.abs(fh - fa) > 0.3)
    rationale.push(`${fh > fa ? home.name : away.name} arrive in noticeably better form.`);
  rationale.push(
    `${home.name} get a home-advantage boost of ${Math.round(((input.homeAdvantage ?? MODEL.HOME_ADVANTAGE) - 1) * 100)}%.`,
  );
  if (input.headToHead)
    rationale.push(
      `Recent meetings average ${input.headToHead.avgGoals.toFixed(1)} goals, nudging the total.`,
    );
  if (conf.level === "low")
    rationale.push("The sides are closely matched, so no outcome is clearly favoured.");

  return {
    homeWin: round(homeWin),
    draw: round(draw),
    awayWin: round(awayWin),
    expectedGoals: { home: round(xg.home, 2), away: round(xg.away, 2) },
    mostLikely: top[0]!,
    topScorelines: top,
    confidence: conf.level,
    confidenceScore: conf.score,
    btts: round(btts),
    over25: round(over25),
    fairOdds: { home: odds(homeWin), draw: odds(draw), away: odds(awayWin) },
    matrix,
    rationale,
  };
}
