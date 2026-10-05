import { describe, expect, it } from 'vitest';
import {
  CHARGE_TAC_BONUS,
  swingTacAndDef,
  tacForAttack,
} from '@/core/attacks/swingTac';
import { NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('tacForAttack', () => {
  it('sums base TAC, charge, bonuses and penalties', () => {
    const attacker = makeAttacker({ tac: 6 });
    const carriedBonus = 2;
    const cover = 1;
    const bonusTime = 1;
    const crowdedOut = -1;

    const expected =
      6 + CHARGE_TAC_BONUS + carriedBonus - cover + bonusTime + crowdedOut;

    expect(
      tacForAttack(
        attacker,
        0,
        0,
        carriedBonus,
        2,
        cover,
        bonusTime,
        crowdedOut,
      ),
    ).toBe(expected);

    expect(tacForAttack(attacker, 1, 0, 0, 2, 0, 0, 0)).toBe(6);
  });
});

describe('swingTacAndDef', () => {
  const attacker = makeAttacker({ tac: 6 });
  const FLOOR_DEF = 2;

  const swing = (attackIndex: number) => {
    return swingTacAndDef(
      attacker,
      [['kd'], ['one']],
      [[null], [null]],
      attackIndex,
      NO_ATTACK_INDEX,
      false,
      false,
      NO_MODS,
      FLOOR_DEF,
      [false, false],
      0,
      2,
    );
  };

  it('reads the plain TAC and DEF on the first swing', () => {
    expect(swing(0)).toEqual({ tac: 6, defMinRoll: 2 });
  });

  it('turns a DEF reduction past the floor into an extra die', () => {
    expect(swing(1)).toEqual({ tac: 7, defMinRoll: 2 });
  });
});
