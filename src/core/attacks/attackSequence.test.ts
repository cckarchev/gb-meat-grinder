import { describe, expect, it } from 'vitest';
import { computeAttackSequence } from '@/core/attacks/attackSequence';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const COVER = true;

const STANCE = true;

const NO_BONUS_TIME = [false, false];

describe('computeAttackSequence', () => {
  const attacker = makeAttacker({ tac: 6 });

  it('builds per-swing roll contexts with binomial success odds', () => {
    const { attacks } = computeAttackSequence(
      attacker,
      4,
      1,
      [['two'], ['one']],
      [[null], [null]],
      NO_ATTACK_INDEX,
      !COVER,
      !STANCE,
      NO_MODS,
      NO_BONUS_TIME,
      0,
      2,
    );

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
    const { attacks } = computeAttackSequence(
      attacker,
      4,
      1,
      [['gb'], ['one']],
      [['playTac'], [null]],
      NO_ATTACK_INDEX,
      !COVER,
      !STANCE,
      NO_MODS,
      NO_BONUS_TIME,
      0,
      2,
    );

    expect(attacks.map((attack) => attack.tac)).toEqual([6, 8]);
  });
});
