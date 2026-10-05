import { describe, expect, it } from 'vitest';
import {
  damageQuantile,
  pickedDamageForNet,
  planDamageOutcome,
} from '@/core/killOdds';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';
import type { AttackRollContext } from '@/types/core/attackSequence';

describe('pickedDamageForNet', () => {
  const attacker = makeAttacker();

  it('deals the picked line once the roll reaches it', () => {
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 2)).toBe(2);
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 3)).toBe(2);
  });

  it('falls back to the best lower line on a short roll', () => {
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 1)).toBe(1);
    expect(pickedDamageForNet(attacker, NO_MODS, ['two'], 0)).toBe(0);
  });

  it('resolves wrap slots past the card width', () => {
    expect(pickedDamageForNet(attacker, NO_MODS, ['four', 'two'], 5)).toBe(5);
    expect(pickedDamageForNet(attacker, NO_MODS, ['four', 'two'], 6)).toBe(6);
  });
});

describe('damageQuantile', () => {
  const distribution = new Map([
    [0, 0.25],
    [2, 0.5],
    [5, 0.25],
  ]);

  it('returns the smallest damage whose cumulative probability reaches q', () => {
    expect(damageQuantile(distribution, 0.1)).toBe(0);
    expect(damageQuantile(distribution, 0.5)).toBe(2);
    expect(damageQuantile(distribution, 0.76)).toBe(5);
    expect(damageQuantile(distribution, 1)).toBe(5);
  });

  it('returns the largest damage when q exceeds the total mass', () => {
    const partial = new Map([
      [1, 0.4],
      [3, 0.5],
    ]);

    expect(damageQuantile(partial, 0.95)).toBe(3);
  });

  it('is 0 for an empty distribution', () => {
    expect(damageQuantile(new Map(), 0.5)).toBe(0);
  });
});

describe('planDamageOutcome', () => {
  it('convolves swings and folds in flat damage', () => {
    const attacker = makeAttacker();
    const swing: AttackRollContext = {
      attackIndex: 0,
      tac: 2,
      armor: 0,
      defMinRoll: 4,
      pHit: 0.5,
      netSuccessesNeeded: 1,
      prob: 0.75,
    };
    const flatDamage = 1;
    const targetHp = 2;

    // Net 0 (1/4) deals 0, net 1 or 2 (3/4) deals `one`. Plus 1 flat.
    const outcome = planDamageOutcome(
      attacker,
      [swing],
      [['one']],
      NO_MODS,
      flatDamage,
      targetHp,
    );

    expect(outcome.killProbability).toBeCloseTo(0.75);
    expect(outcome.expectedDamage).toBeCloseTo(1.75);
    expect(outcome.expectedHpRemaining).toBeCloseTo(0.25);
    expect([...outcome.damageDistribution]).toEqual([
      [1, 0.25],
      [2, 0.75],
    ]);
  });
});
