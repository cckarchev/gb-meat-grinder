import { describe, expect, it } from 'vitest';
import {
  effectiveDefMinRoll,
  enemyDefForSwing,
  tacBonusFromDefReductionCap,
} from '@/core/attacks/swingDefense';

const STANCE = true;

describe('enemyDefForSwing', () => {
  it('adds +1 DEF from Defensive Stance on the charge only, capped at 6', () => {
    expect(enemyDefForSwing(4, 0, 0, STANCE, 2)).toBe(5);
    expect(enemyDefForSwing(6, 0, 0, STANCE, 2)).toBe(6);
    expect(enemyDefForSwing(4, 1, 0, STANCE, 2)).toBe(4);
    expect(enemyDefForSwing(4, 0, 0, !STANCE, 2)).toBe(4);
  });
});

describe('DEF floor', () => {
  it('clamps the to-hit roll to 2+..6+', () => {
    expect(effectiveDefMinRoll(4, 1)).toBe(3);
    expect(effectiveDefMinRoll(3, 5)).toBe(2);
    expect(effectiveDefMinRoll(7, 0)).toBe(6);
  });

  it('turns DEF reduction past 2+ into bonus dice', () => {
    expect(tacBonusFromDefReductionCap(2, 1)).toBe(1);
    expect(tacBonusFromDefReductionCap(0, 0)).toBe(2);
    expect(tacBonusFromDefReductionCap(4, 1)).toBe(0);
  });
});
