import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { planDamageOutcome } from '@/core/damage/killOdds';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS, PLAY_DAMAGE } from '@/core/testing/fixtures';

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
      [],
    );

    expect(outcome.killProbability).toBeCloseTo(0.75);
    expect(outcome.expectedDamage).toBeCloseTo(1.75);
    expect(outcome.expectedHpRemaining).toBeCloseTo(0.25);

    expect([...outcome.damageDistribution]).toEqual([
      [1, 0.25],
      [2, 0.75],
    ]);
  });

  it('counts an Once Per Turn damaging play once across the activation', () => {
    const attacker = makeAttacker({ characterPlays: [PLAY_DAMAGE], tac: 20 });
    const wrapPicks = [['gb'], ['gb']];
    const characterPlayPicks = [['playDamage'], ['playDamage']];
    const plan = { wrapPicks, characterPlayPicks };

    const rollParams = {
      attacker,
      chargeAttackIndex: NO_ATTACK_INDEX,
      armor: 0,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      damageMods: NO_MODS,
      enemyDef: 2,
      bonusTimeByAttack: [false, false],
      initialTacModifier: 0,
      activeBaseCount: 2,
    };

    const timeline = activationTimeline(plan, rollParams);
    const { attacks } = computeAttackSequence(plan, rollParams);

    const outcome = planDamageOutcome(
      attacker,
      attacks,
      wrapPicks,
      NO_MODS,
      0,
      100,
      timeline,
    );

    // With 20 dice both swings almost surely reach `gb`: 1 + 3, then 1.
    expect(outcome.expectedDamage).toBeCloseTo(5, 2);
  });
});
