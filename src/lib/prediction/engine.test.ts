import { describe, expect, it } from "vitest";
import { TEAMS, HEAD_TO_HEAD } from "@/data/teams";
import type { Team } from "@/types/football";
import { expectedGoals, formIndex, poissonPmf, predictMatch, scoreMatrix } from "./index";

const byId = (id: string) => TEAMS.find((t) => t.id === id)!;
const clone = (t: Team, patch: Partial<Team["stats"]> = {}, id = t.id + "-x"): Team => ({
  ...t,
  id,
  stats: { ...t.stats, ...patch },
});

describe("poisson", () => {
  it("pmf sums to ~1", () => {
    let s = 0;
    for (let k = 0; k < 30; k++) s += poissonPmf(k, 1.7);
    expect(s).toBeCloseTo(1, 6);
  });
  it("matches known value", () => {
    expect(poissonPmf(2, 1.5)).toBeCloseTo(0.2510, 4);
  });
  it("matrix is normalised", () => {
    const total = scoreMatrix(1.4, 1.1).flat().reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 8);
  });
});

describe("formIndex", () => {
  it("is bounded", () => {
    expect(formIndex(["W", "W", "W", "W", "W"])).toBe(1);
    expect(formIndex(["L", "L", "L", "L", "L"])).toBe(-1);
    expect(formIndex([])).toBe(0);
  });
  it("weights recent games more", () => {
    expect(formIndex(["L", "W"])).toBeGreaterThan(formIndex(["W", "L"]));
  });
});

describe("predictMatch", () => {
  const home = TEAMS[0];
  const away = TEAMS[1];
  const p = predictMatch({ home, away });

  it("outcome probabilities sum to 1", () => {
    expect(p.homeWin + p.draw + p.awayWin).toBeCloseTo(1, 3);
  });
  it("probabilities are in range", () => {
    for (const v of [p.homeWin, p.draw, p.awayWin, p.btts, p.over25]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(p.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(p.confidenceScore).toBeLessThanOrEqual(100);
  });
  it("most likely scoreline is the top of the list, sorted desc", () => {
    expect(p.mostLikely).toEqual(p.topScorelines[0]);
    for (let i = 1; i < p.topScorelines.length; i++)
      expect(p.topScorelines[i - 1].probability).toBeGreaterThanOrEqual(p.topScorelines[i].probability);
  });
  it("fair odds are inverse probabilities", () => {
    expect(p.fairOdds.home).toBeCloseTo(1 / p.homeWin, 1);
  });
  it("home advantage favours the home side", () => {
    const t = TEAMS[2];
    const mirror = clone(t);
    const r = predictMatch({ home: t, away: mirror });
    expect(r.homeWin).toBeGreaterThan(r.awayWin);
    const neutral = predictMatch({ home: t, away: mirror, homeAdvantage: 1 });
    expect(neutral.homeWin).toBeCloseTo(neutral.awayWin, 2);
  });
  it("stronger attack raises expected goals", () => {
    const base = expectedGoals({ home, away });
    const boosted = expectedGoals({ home: clone(home, { goalsForPerGame: 3.5, xgForPerGame: 3.5 }), away });
    expect(boosted.home).toBeGreaterThan(base.home);
  });
  it("expected goals stay within clamps", () => {
    const monster = clone(home, { goalsForPerGame: 20, xgForPerGame: 20 });
    expect(expectedGoals({ home: monster, away }).home).toBeLessThanOrEqual(4.5);
  });
  it("head-to-head shifts totals toward historical average", () => {
    const h = HEAD_TO_HEAD.find((x) => x.key.includes(home.id))!;
    const [a, b] = h.key.split("__");
    const H = byId(a), A = byId(b);
    const without = expectedGoals({ home: H, away: A });
    const withH = expectedGoals({ home: H, away: A, headToHead: h });
    const dirWithout = h.avgGoals - (without.home + without.away);
    const moved = withH.home + withH.away - (without.home + without.away);
    expect(Math.sign(moved)).toBe(Math.sign(dirWithout));
  });
  it("rejects a team playing itself", () => {
    expect(() => predictMatch({ home, away: home })).toThrow();
  });
  it("always includes rationale", () => {
    expect(p.rationale.length).toBeGreaterThan(0);
  });
});
