import { describe, expect, it } from 'vitest';
import { activationTimeline } from '@/core/attacks/activationTimeline';
import { sumSwingTac, swingTacAndDef } from '@/core/attacks/swingTac';
import { CHARGE_TAC_BONUS } from '@/core/shared/constants';
import { makeAttacker, makeRollParams } from '@/core/testing/fixtures';

describe('sumSwingTac', () => {
  it('sums base TAC, charge, bonuses and penalties', () => {
    const attacker = makeAttacker({ tac: 6 });
    const carriedBonus = 2;
    const cover = 1;
    const bonusTime = 1;
    const crowdedOut = -1;

    const expected =
      6 + CHARGE_TAC_BONUS + carriedBonus - cover + bonusTime + crowdedOut;

    const chargeSwing = {
      attacker,
      attackIndex: 0,
      chargeAttackIndex: 0,
      activeBaseCount: 2,
      carriedTacBonus: carriedBonus,
      coverTacPenalty: cover,
      bonusTimeTacBonus: bonusTime,
      initialTacModifier: crowdedOut,
    };

    const plainSwing = {
      attacker,
      attackIndex: 1,
      chargeAttackIndex: 0,
      activeBaseCount: 2,
      carriedTacBonus: 0,
      coverTacPenalty: 0,
      bonusTimeTacBonus: 0,
      initialTacModifier: 0,
    };

    expect(sumSwingTac(chargeSwing)).toBe(expected);
    expect(sumSwingTac(plainSwing)).toBe(6);
  });
});

describe('swingTacAndDef', () => {
  const attacker = makeAttacker({ tac: 6 });
  const FLOOR_DEF = 2;

  const plan = {
    wrapPicks: [['kd'], ['one']],
    characterPlayPicks: [[null], [null]],
  };

  const params = makeRollParams({ attacker, enemyDef: FLOOR_DEF });

  const swing = (attackIndex: number) => {
    const timeline = activationTimeline(plan, params);

    return swingTacAndDef(plan, attackIndex, params, timeline);
  };

  it('reads the plain TAC and DEF on the first swing', () => {
    expect(swing(0)).toEqual({ tac: 6, defMinRoll: 2 });
  });

  it('turns a DEF reduction past the floor into an extra die', () => {
    expect(swing(1)).toEqual({ tac: 7, defMinRoll: 2 });
  });
});
