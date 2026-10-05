import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import type { ActivationRollParams } from '@/core/attacks/attackSequence.types';
import { makeAttacker, makeRollParams } from '@/core/testing/fixtures';

const COVER = true;

const STANCE = true;

const NO_BONUS_TIME = [false, false];

const params: ActivationRollParams = makeRollParams({
  attacker: makeAttacker({ tac: 6 }),
  armor: 1,
  enemyHasCover: !COVER,
  enemyDefensiveStance: !STANCE,
  enemyDef: 4,
  bonusTimeByAttack: NO_BONUS_TIME,
});

describe('computeAttackSequence', () => {
  it('builds per-swing roll contexts with binomial success odds', () => {
    const plan = {
      wrapPicks: [['two'], ['one']],
      characterPlayPicks: [[null], [null]],
    };

    const { attacks } = computeAttackSequence(plan, params);

    // 6 dice at 4+ (p = 1/2), ARM 1. Row 0 needs 2 net (3 hits), row 1 needs 1.
    expect(attacks).toEqual([
      {
        attackIndex: 0,
        tac: 6,
        armor: 1,
        defMinRoll: 4,
        pHit: 0.5,
        netSuccessesNeeded: 2,
        prob: 42 / 64,
      },
      {
        attackIndex: 1,
        tac: 6,
        armor: 1,
        defMinRoll: 4,
        pHit: 0.5,
        netSuccessesNeeded: 1,
        prob: 57 / 64,
      },
    ]);
  });

  it('carries character play effects to later swings', () => {
    const plan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playTac'], [null]],
    };

    const { attacks } = computeAttackSequence(plan, params);

    expect(attacks.map((attack) => attack.tac)).toEqual([6, 8]);
  });
});

describe('the activation timeline of the sequence', () => {
  it('is returned with the swings, so callers do not rebuild it', () => {
    const plan = {
      wrapPicks: [['gb'], ['one']],
      characterPlayPicks: [['playTac'], [null]],
    };

    const { timeline } = computeAttackSequence(plan, params);

    expect(timeline).toEqual(activationTimeline(plan, params));
  });
});
