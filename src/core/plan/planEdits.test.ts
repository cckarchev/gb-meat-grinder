import { describe, expect, it } from 'vitest';
import type { AttackPlan } from '@/core/plan/attackPlan.types';
import {
  nextPlanAfterCharacterPlayPick,
  nextPlanAfterClearWrapContinuation,
  nextPlanAfterWrapChoice,
} from '@/core/plan/planEdits';
import type { PlaybookChoiceId } from '@/core/playbook/playbook.types';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const attacker = makeAttacker();

const plan = (
  wrapPicks: AttackPlan['wrapPicks'],
  characterPlayPicks: AttackPlan['characterPlayPicks'],
): AttackPlan => {
  return { wrapPicks, characterPlayPicks };
};

const wrapChoice = (
  attackIndex: number,
  pickIndex: number,
  id: PlaybookChoiceId | null,
) => {
  return { attackIndex, pickIndex, id };
};

describe('nextPlanAfterWrapChoice', () => {
  const prev = plan([['one'], ['two']], [[null], [null]]);

  it('is a no-op for clearing slot 0 or re-picking the same line', () => {
    expect(
      nextPlanAfterWrapChoice(prev, wrapChoice(0, 0, null), attacker),
    ).toBeNull();
    expect(
      nextPlanAfterWrapChoice(prev, wrapChoice(0, 0, 'one'), attacker),
    ).toBeNull();
  });

  it('defaults the character play on a GB pick and clears it otherwise', () => {
    const withGb = nextPlanAfterWrapChoice(
      prev,
      wrapChoice(1, 0, 'gb'),
      attacker,
    );

    expect(withGb).toEqual(plan([['one'], ['gb']], [[null], ['playTac']]));

    if (!withGb) {
      return;
    }

    expect(
      nextPlanAfterWrapChoice(withGb, wrapChoice(1, 0, 'one'), attacker),
    ).toEqual(plan([['one'], ['one']], [[null], [null]]));
  });
});

describe('nextPlanAfterClearWrapContinuation', () => {
  it('keeps only the first pick of the row', () => {
    const prev = plan([['gb', 'two'], ['one']], [['playDef', null], [null]]);

    expect(nextPlanAfterClearWrapContinuation(prev, 0, attacker)).toEqual(
      plan([['gb'], ['one']], [['playDef'], [null]]),
    );
  });

  it('is a no-op without a continuation', () => {
    const prev = plan([['one']], [[null]]);

    expect(nextPlanAfterClearWrapContinuation(prev, 0, attacker)).toBeNull();
  });
});

describe('nextPlanAfterCharacterPlayPick', () => {
  const prev = plan([['gb'], ['gb']], [['playTac'], ['playDef']]);
  const params = { attacker, damageMods: NO_MODS, activeBaseCount: 2 };

  const firstSlot = (pick: string) => {
    return { attackIndex: 0, pickIndex: 0, pick };
  };

  it('is a no-op for the same play', () => {
    expect(
      nextPlanAfterCharacterPlayPick(prev, firstSlot('playTac'), params),
    ).toBeNull();
  });

  it('re-sanitizes later picks that became illegal', () => {
    expect(
      nextPlanAfterCharacterPlayPick(prev, firstSlot('playDef'), params),
    ).toEqual(plan([['gb'], ['gb']], [['playDef'], ['playTac']]));
  });
});

describe('plan edge cases', () => {
  it('pads the play row when picking a later wrap slot', () => {
    const prev = plan([['four', null]], [[null]]);

    expect(
      nextPlanAfterWrapChoice(prev, wrapChoice(0, 1, 'gb'), attacker),
    ).toEqual(plan([['four', 'gb']], [[null, 'playTac']]));
  });

  it('drops a stale play when the kept first pick is not GB', () => {
    const prev = plan([['one', 'two']], [['playTac', null]]);

    expect(nextPlanAfterClearWrapContinuation(prev, 0, attacker)).toEqual(
      plan([['one']], [[null]]),
    );
  });
});
