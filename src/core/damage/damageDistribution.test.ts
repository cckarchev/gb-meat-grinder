import { describe, expect, it } from 'vitest';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import {
  damageQuantile,
  swingDamageDistribution,
} from '@/core/damage/damageDistribution';
import { makeRollContext } from '@/core/testing/fixtures';

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

describe('swingDamageDistribution with gained net hits', () => {
  it('shifts every roll up by the bonus, so a soaked roll still reaches it', () => {
    const attack: AttackRollContext = makeRollContext({
      attackIndex: 0,
      tac: 1,
      armor: 1,
      defMinRoll: 4,
      pHit: 0.5,
      netSuccessesNeeded: 2,
      netHitBonus: 2,
      prob: 1,
    });

    // 1 die vs ARM 1 always nets 0 from the roll; the bonus makes it 2.
    const dist = swingDamageDistribution(attack, (net) => net * 10);

    expect([...dist.entries()]).toEqual([[20, 1]]);
  });
});
