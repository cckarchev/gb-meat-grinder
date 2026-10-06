import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { planDamageOutcome } from '@/core/damage/killOdds';
import {
  makeAttacker,
  makeRollParams,
  NO_MODS,
  PLAY_DAMAGE,
  PLAY_HALF_HEALTH,
} from '@/core/testing/fixtures';

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

    const rollParams = makeRollParams({ attacker, enemyDef: 2 });

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

  it('scales a current-HP play by the damage each roll actually dealt before it', () => {
    const attacker = makeAttacker({ characterPlays: [PLAY_HALF_HEALTH] });
    const wrapPicks = [['one'], ['gb']];
    const characterPlayPicks = [[null], ['playHalfHealth']];
    const plan = { wrapPicks, characterPlayPicks };
    const targetHp = 10;

    const timeline = activationTimeline(
      plan,
      makeRollParams({ attacker, targetHp }),
    );

    // A coin flip for `one`, then a sure `gb`.
    const coinFlip: AttackRollContext = {
      attackIndex: 0,
      tac: 1,
      armor: 0,
      defMinRoll: 4,
      pHit: 0.5,
      netSuccessesNeeded: 1,
      prob: 0.5,
    };

    const sureHit: AttackRollContext = {
      attackIndex: 1,
      tac: 3,
      armor: 0,
      defMinRoll: 2,
      pHit: 1,
      netSuccessesNeeded: 3,
      prob: 1,
    };

    const outcome = planDamageOutcome(
      attacker,
      [coinFlip, sureHit],
      wrapPicks,
      NO_MODS,
      0,
      targetHp,
      timeline,
    );

    // Miss: 0 + 1 + half of 10 = 6. Hit: 1 + 1 + half of 9 = 6.
    expect([...outcome.damageDistribution]).toEqual([[6, 1]]);
  });
});
