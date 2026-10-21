import { describe, expect, it } from 'vitest';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { killingBlowDisplayIndex } from '@/core/damage/killingBlow';
import { makeRollContext } from '@/core/testing/fixtures';

const swing = (attackIndex: number): AttackRollContext => {
  return makeRollContext({
    attackIndex,
    tac: 0,
    armor: 0,
    defMinRoll: 4,
    pHit: 0.5,
    netSuccessesNeeded: 0,
    netHitBonus: 0,
    prob: 1,
  });
};

const ATTACKS = [swing(0), swing(2), swing(1)];
const ROW_0_DAMAGE = 3;
const ROW_1_DAMAGE = 5;
const ROW_DAMAGE = [ROW_0_DAMAGE, ROW_1_DAMAGE, 2];
const SURVIVING_HP = 100;

describe('killingBlowDisplayIndex', () => {
  it('returns the display index of the swing that reaches the target HP', () => {
    // Flat 1, then rows 0 (3) and 2 (2): total 6 on display index 1.
    const targetHp = 1 + ROW_0_DAMAGE + 2;

    expect(killingBlowDisplayIndex(ATTACKS, ROW_DAMAGE, 1, targetHp)).toBe(1);
  });

  it('returns -1 when the target survives', () => {
    const flatDamageWithNoSwings = 50;

    expect(killingBlowDisplayIndex(ATTACKS, ROW_DAMAGE, 0, SURVIVING_HP)).toBe(
      -1,
    );
    expect(
      killingBlowDisplayIndex([], ROW_DAMAGE, flatDamageWithNoSwings, 1),
    ).toBe(-1);
  });

  it('treats missing row damage as 0', () => {
    const rowWithoutDamage = 9;

    expect(
      killingBlowDisplayIndex([swing(rowWithoutDamage)], ROW_DAMAGE, 0, 1),
    ).toBe(-1);
  });
});
