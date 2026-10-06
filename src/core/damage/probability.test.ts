import { describe, expect, it } from 'vitest';
import {
  binomialPmf,
  hitProbabilityPerDie,
  maxNetSuccessesForRoll,
  probAttackSucceeds,
} from '@/core/damage/probability';

const COIN_FLIP = 0.5;
const NO_BONUS = 0;

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
    expect(probAttackSucceeds(3, COIN_FLIP, 1, 0, NO_BONUS)).toBe(1);
  });

  it('is impossible when the raw hits needed exceed the dice', () => {
    expect(probAttackSucceeds(2, COIN_FLIP, 1, 2, NO_BONUS)).toBe(0);
  });

  it('sums the binomial tail from need + armor hits', () => {
    // 3 dice, ARM 1, need 1 net: P(hits >= 2) = (3 + 1) / 8.
    expect(probAttackSucceeds(3, COIN_FLIP, 1, 1, NO_BONUS)).toBeCloseTo(4 / 8);
  });
});

describe('maxNetSuccessesForRoll', () => {
  it('is TAC minus ARM, floored at 0', () => {
    expect(maxNetSuccessesForRoll(5, 2, NO_BONUS)).toBe(3);
    expect(maxNetSuccessesForRoll(2, 5, NO_BONUS)).toBe(0);
  });
});

describe('net hits gained on top of the roll (Instruction)', () => {
  const BONUS = 2;

  it('makes any need up to the bonus certain, even with no hits', () => {
    expect(probAttackSucceeds(3, COIN_FLIP, 5, 2, BONUS)).toBe(1);
  });

  it('lowers the raw hits needed by the bonus', () => {
    // 3 dice, ARM 1, need 3 net: 1 net from the roll, so P(hits >= 2) = 4 / 8.
    expect(probAttackSucceeds(3, COIN_FLIP, 1, 3, BONUS)).toBeCloseTo(4 / 8);
  });

  it('adds the bonus after flooring the roll at 0 net', () => {
    expect(maxNetSuccessesForRoll(5, 2, BONUS)).toBe(5);
    expect(maxNetSuccessesForRoll(2, 5, BONUS)).toBe(2);
  });
});
