import { describe, expect, it } from 'vitest';
import { sumSwingTac, swingTacAndDef } from '@/core/attacks/swingTac';
import { CHARGE_TAC_BONUS, NO_ATTACK_INDEX } from '@/core/shared/constants';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

describe('sumSwingTac', () => {
  it('sums base TAC, charge, bonuses and penalties', () => {
    const attacker = makeAttacker({ tac: 6 });
    const carriedBonus = 2;
    const cover = 1;
    const bonusTime = 1;
    const crowdedOut = -1;

    const expected =
      6 + CHARGE_TAC_BONUS + carriedBonus - cover + bonusTime + crowdedOut;

    expect(
      sumSwingTac(
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

    expect(sumSwingTac(attacker, 1, 0, 0, 2, 0, 0, 0)).toBe(6);
  });
});

describe('swingTacAndDef', () => {
  const attacker = makeAttacker({ tac: 6 });
  const FLOOR_DEF = 2;

  const plan = {
    wrapPicks: [['kd'], ['one']],
    characterPlayPicks: [[null], [null]],
  };

  const params = {
    attacker,
    chargeAttackIndex: NO_ATTACK_INDEX,
    armor: 0,
    enemyHasCover: false,
    enemyDefensiveStance: false,
    damageMods: NO_MODS,
    enemyDef: FLOOR_DEF,
    bonusTimeByAttack: [false, false],
    initialTacModifier: 0,
    activeBaseCount: 2,
  };

  const swing = (attackIndex: number) => {
    return swingTacAndDef(plan, attackIndex, params);
  };

  it('reads the plain TAC and DEF on the first swing', () => {
    expect(swing(0)).toEqual({ tac: 6, defMinRoll: 2 });
  });

  it('turns a DEF reduction past the floor into an extra die', () => {
    expect(swing(1)).toEqual({ tac: 7, defMinRoll: 2 });
  });
});
