import { describe, expect, it } from 'vitest';
import {
  binomialPmf,
  formatPercent,
  hitProbabilityPerDie,
  maxNetSuccessesForRoll,
  probAttackSucceeds,
} from '@/core/damage/probability';

const COIN_FLIP = 0.5;

describe('binomialPmf', () => {
  it('matches C(n,k) p^k (1-p)^(n-k)', () => {
    expect(binomialPmf(4, COIN_FLIP, 2)).toBeCloseTo(6 / 16);
    expect(binomialPmf(3, COIN_FLIP, 0)).toBeCloseTo(1 / 8);
  });

  it('is 0 outside 0..n', () => {
    expect(binomialPmf(3, COIN_FLIP, 4)).toBe(0);
    expect(binomialPmf(3, COIN_FLIP, -1)).toBe(0);
  });
});

describe('hitProbabilityPerDie', () => {
  it('maps a DEF N+ to (7 - N) / 6', () => {
    expect(hitProbabilityPerDie(2)).toBeCloseTo(5 / 6);
    expect(hitProbabilityPerDie(4)).toBeCloseTo(1 / 2);
    expect(hitProbabilityPerDie(6)).toBeCloseTo(1 / 6);
  });
});

describe('probAttackSucceeds', () => {
  it('is certain when no net successes are needed', () => {
    expect(probAttackSucceeds(3, COIN_FLIP, 1, 0)).toBe(1);
  });

  it('is impossible when the raw hits needed exceed the dice', () => {
    expect(probAttackSucceeds(2, COIN_FLIP, 1, 2)).toBe(0);
  });

  it('sums the binomial tail from need + armor hits', () => {
    // 3 dice, ARM 1, need 1 net: P(hits >= 2) = (3 + 1) / 8.
    expect(probAttackSucceeds(3, COIN_FLIP, 1, 1)).toBeCloseTo(4 / 8);
  });
});

describe('formatPercent', () => {
  it('formats with one decimal by default', () => {
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('honors the digits argument', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%');
  });

  it('collapses tiny positive values and non-finite input', () => {
    expect(formatPercent(0.00005)).toBe('<0.01%');
    expect(formatPercent(Number.NaN)).toBe('-');
  });
});

describe('maxNetSuccessesForRoll', () => {
  it('is TAC minus ARM, floored at 0', () => {
    expect(maxNetSuccessesForRoll(5, 2)).toBe(3);
    expect(maxNetSuccessesForRoll(2, 5)).toBe(0);
  });
});
