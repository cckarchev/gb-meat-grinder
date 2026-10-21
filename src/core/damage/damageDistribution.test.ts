import { describe, expect, it } from 'vitest';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import {
  damageQuantile,
  swingDamageDistribution,
} from '@/core/damage/damageDistribution';
import { makeRollContext } from '@/core/testing/fixtures';

const QUARTER = 0.25;
const HALF = 0.5;

describe('damageQuantile', () => {
  const bigHit = 5;

  const distribution = new Map([
    [0, QUARTER],
    [2, HALF],
    [bigHit, QUARTER],
  ]);

  it('returns the smallest damage whose cumulative probability reaches q', () => {
    const insideFirstQuarter = 0.1;
    const pastThreeQuarters = 0.76;

    expect(damageQuantile(distribution, insideFirstQuarter)).toBe(0);
    expect(damageQuantile(distribution, HALF)).toBe(2);
    expect(damageQuantile(distribution, pastThreeQuarters)).toBe(bigHit);
    expect(damageQuantile(distribution, 1)).toBe(bigHit);
  });

  it('returns the largest damage when q exceeds the total mass', () => {
    const largest = 3;
    const lowMass = 0.4;
    const pastTotalMass = 0.95;

    const partial = new Map([
      [1, lowMass],
      [largest, HALF],
    ]);

    expect(damageQuantile(partial, pastTotalMass)).toBe(largest);
  });

  it('is 0 for an empty distribution', () => {
    expect(damageQuantile(new Map(), HALF)).toBe(0);
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
    const damagePerNet = 10;
    const dist = swingDamageDistribution(attack, (net) => net * damagePerNet);

    expect([...dist.entries()]).toEqual([[2 * damagePerNet, 1]]);
  });
});
