import { describe, expect, it } from 'vitest';
import {
  CHARGE_TAC_BONUS,
  coverTacPenaltyForAttack,
  effectiveDefMinRoll,
  enemyDefBaseForAttackRow,
  modifiersBeforeAttack,
  tacBonusFromDefReductionCap,
  tacForAttack,
} from '@/core/swingModifiers';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const COVER = true;

const STANCE = true;

describe('enemyDefBaseForAttackRow', () => {
  it('adds +1 DEF from Defensive Stance on the charge only, capped at 6', () => {
    expect(enemyDefBaseForAttackRow(4, 0, 0, STANCE, 2)).toBe(5);
    expect(enemyDefBaseForAttackRow(6, 0, 0, STANCE, 2)).toBe(6);
    expect(enemyDefBaseForAttackRow(4, 1, 0, STANCE, 2)).toBe(4);
    expect(enemyDefBaseForAttackRow(4, 0, 0, !STANCE, 2)).toBe(4);
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

describe('coverTacPenaltyForAttack', () => {
  const attacker = makeAttacker();

  it('costs 1 die until an earlier swing pushes', () => {
    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['push'], ['one']], 0, 2),
    ).toBe(1);

    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['push'], ['one']], 1, 2),
    ).toBe(0);

    expect(
      coverTacPenaltyForAttack(attacker, COVER, [['one'], ['push']], 1, 2),
    ).toBe(1);
  });

  it('is 0 without cover', () => {
    expect(
      coverTacPenaltyForAttack(attacker, !COVER, [['one'], ['one']], 1, 2),
    ).toBe(0);
  });
});

describe('modifiersBeforeAttack', () => {
  it('collects TAC and DEF carry-over from earlier swings', () => {
    const attacker = makeAttacker({ inf: 3 });

    expect(
      modifiersBeforeAttack(
        attacker,
        [['gb'], ['kd'], ['one']],
        [['playTac'], [null], [null]],
        2,
        NO_MODS,
        3,
      ),
    ).toEqual({ tacBonus: 2, defReduction: 1 });
  });
});

describe('rows outside the activation', () => {
  const attacker = makeAttacker();

  it('get the full cover penalty and no carry-over', () => {
    expect(coverTacPenaltyForAttack(attacker, COVER, [['push']], 5, 1)).toBe(1);

    expect(
      modifiersBeforeAttack(attacker, [['gb']], [['playTac']], 5, NO_MODS, 1),
    ).toEqual({ tacBonus: 0, defReduction: 0 });
  });
});
