/** Binomial coefficient C(n,k). */
function binomialCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = (c * (n - i)) / (i + 1);
  }
  return c;
}

export function binomialPmf(n: number, p: number, k: number): number {
  return binomialCoeff(n, k) * p ** k * (1 - p) ** (n - k);
}

/** Per-die hit chance: DEF is minimum successful roll (Guild Ball style 2+ … 6+). */
export function hitProbabilityPerDie(defMinRoll: number): number {
  return (7 - defMinRoll) / 6;
}

/**
 * One attack: roll `tac` dice, each hits vs DEF with probability `p`.
 * Net successes = raw hits − ARM. Returns P(net ≥ netSuccessesNeeded), i.e. the
 * chance you reach a playbook column that needs that many net successes.
 */
export function probAttackSucceeds(
  tac: number,
  p: number,
  armor: number,
  netSuccessesNeeded: number,
): number {
  if (netSuccessesNeeded <= 0) return 1;
  const rawHitsNeeded = netSuccessesNeeded + armor;
  if (rawHitsNeeded > tac) return 0;
  // P(S >= rawHitsNeeded), S ~ Binomial(tac, p)
  let tail = 0;
  for (let k = rawHitsNeeded; k <= tac; k++) {
    tail += binomialPmf(tac, p, k);
  }
  return tail;
}

export function formatPercent(x: number, digits = 1): string {
  if (!Number.isFinite(x)) return '-';
  if (x < 0.0001 && x > 0) return '<0.01%';
  return `${(100 * x).toFixed(digits)}%`;
}

/** Max net successes in one roll: all dice hit, then subtract ARM. */
export function maxNetSuccessesForRoll(tac: number, armor: number): number {
  return Math.max(0, tac - armor);
}
