/** Poisson probability mass function P(X = k) for rate lambda. */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0;
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

/**
 * Dixon–Coles low-score correction. Plain independent Poisson under-predicts
 * 0-0 and 1-1 draws; rho < 0 nudges those cells up and 1-0 / 0-1 down.
 */
export function dixonColesTau(h: number, a: number, lh: number, la: number, rho: number): number {
  if (h === 0 && a === 0) return 1 - lh * la * rho;
  if (h === 0 && a === 1) return 1 + lh * rho;
  if (h === 1 && a === 0) return 1 + la * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

/** Normalised scoreline grid [home][away] for goals 0..maxGoals. */
export function scoreMatrix(lh: number, la: number, maxGoals = 10, rho = -0.08): number[][] {
  const m: number[][] = [];
  let total = 0;
  for (let h = 0; h <= maxGoals; h++) {
    const row: number[] = [];
    for (let a = 0; a <= maxGoals; a++) {
      const p = Math.max(
        0,
        poissonPmf(h, lh) * poissonPmf(a, la) * dixonColesTau(h, a, lh, la, rho),
      );
      row.push(p);
      total += p;
    }
    m.push(row);
  }
  return m.map((row) => row.map((p) => p / total));
}
