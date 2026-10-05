import { describe, expect, it } from 'vitest';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { planDamageOutcome } from '@/core/damage/killOdds';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

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
