import { describe, expect, it } from 'vitest';
import {
  CHARGE_TAC_BONUS,
  clampAttackPlan,
  computeAttackSequence,
  coverTacPenaltyForAttack,
  effectiveDefMinRoll,
  enemyDefBaseForAttackRow,
  modifiersBeforeAttack,
  tacBonusFromDefReductionCap,
  tacForAttack,
} from '@/core/attackSequence';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const NO_CHARGE = -1;
const COVER = true;
const STANCE = true;
const NO_BONUS_TIME = [false, false];
const ENEMY_KNOCKED_DOWN = true;

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

describe('computeAttackSequence', () => {
  const attacker = makeAttacker({ tac: 6 });

  it('builds per-swing roll contexts with binomial success odds', () => {
    const { attacks } = computeAttackSequence(
      attacker,
      4,
      1,
      [['two'], ['one']],
      [[null], [null]],
      NO_CHARGE,
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
      NO_CHARGE,
      !COVER,
      !STANCE,
      NO_MODS,
      NO_BONUS_TIME,
      0,
      2,
    );

    expect(attacks.map((a) => a.tac)).toEqual([6, 8]);
  });
});

describe('clampAttackPlan', () => {
  const clamp = (
    tac: number,
    wrapPicks: (string | null)[][],
    activeBaseCount: number,
    enemyKnockedDown = false,
  ) => {
    const attacker = makeAttacker({ tac });
    const characterPlayPicks = wrapPicks.map((row) => row.map(() => null));

    return clampAttackPlan(
      attacker,
      wrapPicks,
      characterPlayPicks,
      NO_CHARGE,
      0,
      !COVER,
      !STANCE,
      NO_MODS,
      4,
      NO_BONUS_TIME,
      0,
      activeBaseCount,
      enemyKnockedDown,
    );
  };

  it('downgrades picks the roll can never reach', () => {
    // 2 dice, ARM 0: max 2 net, so `four` becomes the first net-2 line.
    expect(clamp(2, [['four'], [null]], 1).wrapPicks).toEqual([['push'], []]);
  });

  it('empties rows beyond the active base count', () => {
    expect(clamp(4, [['one'], ['two']], 1).wrapPicks).toEqual([['one'], []]);
  });

  it('replaces every KD after the first one', () => {
    expect(clamp(4, [['kd'], ['kd']], 2).wrapPicks).toEqual([['kd'], ['one']]);
    expect(clamp(4, [['kd'], ['kd']], 2, ENEMY_KNOCKED_DOWN).wrapPicks).toEqual(
      [['one'], ['one']],
    );
  });

  it('returns the same arrays when nothing changes', () => {
    const attacker = makeAttacker({ tac: 4 });
    const wrapPicks = [['one'], ['two']];
    const characterPlayPicks = [[null], [null]];
    const result = clampAttackPlan(
      attacker,
      wrapPicks,
      characterPlayPicks,
      NO_CHARGE,
      0,
      !COVER,
      !STANCE,
      NO_MODS,
      4,
      NO_BONUS_TIME,
      0,
      2,
      false,
    );

    expect(result.wrapPicks).toBe(wrapPicks);
    expect(result.characterPlayPicks).toBe(characterPlayPicks);
  });
});
