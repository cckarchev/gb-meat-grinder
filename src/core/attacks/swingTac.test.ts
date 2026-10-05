import { describe, expect, it } from 'vitest';
import { CHARGE_TAC_BONUS, tacForAttack } from '@/core/attacks/swingTac';
import { makeAttacker } from '@/core/testing/fixtures';

describe('tacForAttack', () => {
  it('sums base TAC, charge, bonuses and penalties', () => {
    const attacker = makeAttacker({ tac: 6 });
    const singledOut = 2;
    const cover = 1;
    const bonusTime = 1;
    const crowdedOut = -1;

    const expected =
      6 + CHARGE_TAC_BONUS + singledOut - cover + bonusTime + crowdedOut;

    expect(
      tacForAttack(attacker, 0, 0, singledOut, 2, cover, bonusTime, crowdedOut),
    ).toBe(expected);

    expect(tacForAttack(attacker, 1, 0, 0, 2)).toBe(6);
  });
});
