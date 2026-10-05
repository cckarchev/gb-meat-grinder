const DIE_FACES = 6;

/** Below this (but above 0), percentages render as a floor instead of 0.0%. */
const TINY_PROBABILITY = 0.0001;
const TINY_PROBABILITY_LABEL = '<0.01%';
const PERCENT = 100;

/** Binomial coefficient C(n,k). */
const binomialCoeff = (n: number, k: number): number => {
  if (k < 0 || k > n) {
    return 0;
  }

  if (k === 0 || k === n) {
    return 1;
  }

  // C(n, k) = C(n, n - k), so loop over the smaller of the two.
  const steps = Math.min(k, n - k);
  let coefficient = 1;

  for (let i = 0; i < steps; i++) {
    coefficient = (coefficient * (n - i)) / (i + 1);
  }

  return coefficient;
};

export const binomialPmf = (n: number, p: number, k: number): number => {
  return binomialCoeff(n, k) * p ** k * (1 - p) ** (n - k);
};

/** Per-die hit chance: DEF is minimum successful roll (Guild Ball style 2+ … 6+). */
export const hitProbabilityPerDie = (defMinRoll: number): number => {
  const hittingFaces = DIE_FACES + 1 - defMinRoll;

  return hittingFaces / DIE_FACES;
};

/**
 * One attack: roll `tac` dice, each hits vs DEF with probability `p`.
 * Net successes = raw hits − ARM. Returns P(net ≥ netSuccessesNeeded), i.e. the
 * chance you reach a playbook column that needs that many net successes.
 */
export const probAttackSucceeds = (
  tac: number,
  p: number,
  armor: number,
  netSuccessesNeeded: number,
): number => {
  if (netSuccessesNeeded <= 0) {
    return 1;
  }

  const rawHitsNeeded = netSuccessesNeeded + armor;

  if (rawHitsNeeded > tac) {
    return 0;
  }

  // P(S >= rawHitsNeeded), S ~ Binomial(tac, p)
  let tail = 0;

  for (let k = rawHitsNeeded; k <= tac; k++) {
    tail += binomialPmf(tac, p, k);
  }

  return tail;
};

export const formatPercent = (probability: number, digits = 1): string => {
  if (!Number.isFinite(probability)) {
    return '-';
  }

  if (probability < TINY_PROBABILITY && probability > 0) {
    return TINY_PROBABILITY_LABEL;
  }

  return `${(PERCENT * probability).toFixed(digits)}%`;
};

/** Max net successes in one roll: all dice hit, then subtract ARM. */
export const maxNetSuccessesForRoll = (tac: number, armor: number): number => {
  return Math.max(0, tac - armor);
};
