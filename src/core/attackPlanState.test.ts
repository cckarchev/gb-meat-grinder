import { describe, expect, it } from 'vitest';
import {
  clampAttackPlanState,
  createInitialAttackPlan,
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from '@/core/attackPlanState';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';
import type { AttackPlan } from '@/types/core/attackPlan';

const attacker = makeAttacker();

const plan = (
  wrapPicks: AttackPlan['wrapPicks'],
  characterPlayPicks: AttackPlan['characterPlayPicks'],
): AttackPlan => {
  return { wrapPicks, characterPlayPicks };
};

describe('createInitialAttackPlan', () => {
  it('starts with empty picks sized to the default roll', () => {
    // TAC 6 vs the default ARM 1: 5 net, which needs two wrap slots.
    expect(createInitialAttackPlan(attacker, 2, false)).toEqual(
      plan(
        [
          [null, null],
          [null, null],
        ],
        [
          [null, null],
          [null, null],
        ],
      ),
    );
  });
});

describe('nextPlanAfterWrapChoice', () => {
  const prev = plan([['one'], ['two']], [[null], [null]]);

  it('is a no-op for clearing slot 0 or re-picking the same line', () => {
    expect(nextPlanAfterWrapChoice(attacker, prev, 0, 0, null)).toBeNull();
    expect(nextPlanAfterWrapChoice(attacker, prev, 0, 0, 'one')).toBeNull();
  });

  it('defaults the character play on a GB pick and clears it otherwise', () => {
    const withGb = nextPlanAfterWrapChoice(attacker, prev, 1, 0, 'gb');

    expect(withGb).toEqual(plan([['one'], ['gb']], [[null], ['playTac']]));

    if (!withGb) {
      return;
    }

    expect(nextPlanAfterWrapChoice(attacker, withGb, 1, 0, 'one')).toEqual(
      plan([['one'], ['one']], [[null], [null]]),
    );
  });
});

describe('nextPlanAfterClearWrapContinuation', () => {
  it('keeps only the first pick of the row', () => {
    const prev = plan([['gb', 'two'], ['one']], [['playDef', null], [null]]);

    expect(nextPlanAfterClearWrapContinuation(attacker, prev, 0)).toEqual(
      plan([['gb'], ['one']], [['playDef'], [null]]),
    );
  });

  it('is a no-op without a continuation', () => {
    const prev = plan([['one']], [[null]]);

    expect(nextPlanAfterClearWrapContinuation(attacker, prev, 0)).toBeNull();
  });
});

describe('nextPlanAfterCharacterPlayPick', () => {
  const prev = plan([['gb'], ['gb']], [['playTac'], ['playDef']]);

  it('is a no-op for the same play', () => {
    expect(
      nextPlanAfterCharacterPlayPick(
        attacker,
        prev,
        0,
        0,
        'playTac',
        NO_MODS,
        2,
      ),
    ).toBeNull();
  });

  it('re-sanitizes later picks that became illegal', () => {
    expect(
      nextPlanAfterCharacterPlayPick(
        attacker,
        prev,
        0,
        0,
        'playDef',
        NO_MODS,
        2,
      ),
    ).toEqual(plan([['gb'], ['gb']], [['playDef'], ['playTac']]));
  });
});

describe('clampAttackPlanState', () => {
  it('returns the previous plan object when clamping changes nothing', () => {
    const prev = plan([['one'], ['two']], [[null], [null]]);
    const result = clampAttackPlanState(prev, {
      attacker: makeAttacker({ tac: 4 }),
      chargeAttackIndex: -1,
      armor: 0,
      enemyHasCover: false,
      enemyDefensiveStance: false,
      damageMods: NO_MODS,
      enemyDef: 4,
      bonusTimeByAttack: [false, false],
      initialTacModifier: 0,
      enemyKnockedDown: false,
      activeBaseCount: 2,
    });

    expect(result).toBe(prev);
  });
});
