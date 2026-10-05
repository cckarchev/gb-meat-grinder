import { describe, expect, it } from 'vitest';
import type { AttackRollContext } from '@/core/attacks/attackSequence.types';
import { killingBlowDisplayIndex } from '@/core/damage/killingBlow';

const swing = (attackIndex: number): AttackRollContext => {
  return {
    attackIndex,
    tac: 0,
    armor: 0,
    defMinRoll: 4,
    pHit: 0.5,
    netSuccessesNeeded: 0,
    prob: 1,
  };
};

const ATTACKS = [swing(0), swing(2), swing(1)];
const ROW_DAMAGE = [3, 5, 2];

describe('killingBlowDisplayIndex', () => {
  it('returns the display index of the swing that reaches the target HP', () => {
    // Flat 1, then rows 0 (3) and 2 (2): total 6 on display index 1.
    expect(killingBlowDisplayIndex(ATTACKS, ROW_DAMAGE, 1, 6)).toBe(1);
  });

  it('returns -1 when the target survives', () => {
    expect(killingBlowDisplayIndex(ATTACKS, ROW_DAMAGE, 0, 100)).toBe(-1);
    expect(killingBlowDisplayIndex([], ROW_DAMAGE, 50, 1)).toBe(-1);
  });

  it('treats missing row damage as 0', () => {
    expect(killingBlowDisplayIndex([swing(9)], ROW_DAMAGE, 0, 1)).toBe(-1);
  });
});
