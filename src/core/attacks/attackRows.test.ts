import { describe, expect, it } from 'vitest';
import {
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '@/core/activation/momentum';
import {
  activationAttackIndices,
  attackRowIsActive,
  attackRowIsBerserker,
  basePicksDealDamage,
  berserkerSourceBaseIndex,
  picksBeforeInActivation,
  picksOnEarlierSwings,
} from '@/core/attacks/attackRows';
import { characterPlayUsageBeforePick } from '@/core/characterPlays/characterPlayUsage';
import { knockDownTakenBeforePick } from '@/core/playbook/knockDown';
import { rowDamageIfAllHit } from '@/core/playbook/rowDamage';
import {
  armorReductionBeforeAttack,
  pickEffectsForLaterSwings,
} from '@/core/playbook/rowEffects';
import { makeAttacker, modsWith, NO_MODS } from '@/core/testing/fixtures';

const TOUGH_HIDE = modsWith({ toughHide: true });

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

describe('activation order', () => {
  const berserker = makeAttacker({ inf: 2, berserker: true });
  const wrapPicks = [['two'], ['dodge'], [null], [null]];

  it('puts each damaging base before its Berserker swing', () => {
    expect(activationAttackIndices(berserker, wrapPicks, NO_MODS, 2)).toEqual([
      0, 2, 1,
    ]);
  });

  it('activates rows by base count and Berserker damage', () => {
    expect(attackRowIsActive(berserker, wrapPicks, 1, NO_MODS, 1)).toBe(false);
    expect(attackRowIsActive(berserker, wrapPicks, 2, NO_MODS, 2)).toBe(true);
    expect(attackRowIsActive(berserker, wrapPicks, 3, NO_MODS, 2)).toBe(false);

    expect(attackRowIsActive(makeAttacker(), wrapPicks, 2, NO_MODS, 2)).toBe(
      false,
    );
  });

  it('maps Berserker rows to their source base', () => {
    expect(attackRowIsBerserker(berserker, 2)).toBe(true);
    expect(attackRowIsBerserker(berserker, 1)).toBe(false);
    expect(berserkerSourceBaseIndex(berserker, 3)).toBe(1);
  });

  it('knows whether base picks deal damage', () => {
    expect(basePicksDealDamage(berserker, ['dodge', 'one'], NO_MODS)).toBe(
      true,
    );

    expect(basePicksDealDamage(berserker, ['one'], TOUGH_HIDE)).toBe(false);
  });

  it('projects damage per active row when every pick hits', () => {
    expect(rowDamageIfAllHit(berserker, wrapPicks, NO_MODS, 2)).toEqual([
      2, 0, 0, 0,
    ]);
  });
});

describe('rows outside the activation', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['kd'], ['one']];
  const plays = [[null], [null]];
  const inactiveRow = 1;
  const activeBaseCount = 1;

  it('fall back to neutral values', () => {
    const momentumParams = {
      attacker,
      wrapPicks,
      damageMods: NO_MODS,
      startingMomentum: 3,
      bonusTimeByAttack: [false, false],
      activeBaseCount,
    };

    expect(momentumPoolBeforeBonusTime(inactiveRow, momentumParams)).toBe(3);

    expect(momentumAfterAttackInclusive(inactiveRow, momentumParams)).toBe(3);

    expect(
      armorReductionBeforeAttack(
        attacker,
        wrapPicks,
        plays,
        NO_MODS,
        inactiveRow,
        activeBaseCount,
      ),
    ).toBe(0);

    expect(
      characterPlayUsageBeforePick(
        attacker,
        wrapPicks,
        plays,
        inactiveRow,
        0,
        NO_MODS,
        activeBaseCount,
      ).size,
    ).toBe(0);

    expect(
      knockDownTakenBeforePick(
        attacker,
        wrapPicks,
        inactiveRow,
        0,
        NO_MODS,
        activeBaseCount,
      ),
    ).toBe(false);
  });

  it('give no effects for an empty pick', () => {
    expect(
      pickEffectsForLaterSwings(attacker, [[null]], [[null]], 0, 0, NO_MODS, 1),
    ).toEqual(NO_EFFECTS);
  });
});

describe('picksBeforeInActivation', () => {
  const berserker = makeAttacker({ inf: 2, berserker: true });
  const wrapPicks = [['two', null], ['one'], ['one'], [null]];

  const picksBefore = (attackIndex: number, pickIndex: number) => {
    return picksBeforeInActivation(
      berserker,
      wrapPicks,
      NO_MODS,
      2,
      attackIndex,
      pickIndex,
    );
  };

  it('walks earlier swings in activation order, Berserkers included', () => {
    expect(picksBefore(1, 0)).toEqual([
      { attackIndex: 0, pickIndex: 0, id: 'two' },
      { attackIndex: 2, pickIndex: 0, id: 'one' },
    ]);
  });

  it('stops before the given pick on its own swing', () => {
    expect(picksBefore(1, 1)).toEqual([
      { attackIndex: 0, pickIndex: 0, id: 'two' },
      { attackIndex: 2, pickIndex: 0, id: 'one' },
      { attackIndex: 1, pickIndex: 0, id: 'one' },
    ]);
  });

  it('lists only earlier swings when asked for whole swings', () => {
    expect(picksOnEarlierSwings(berserker, wrapPicks, NO_MODS, 2, 1)).toEqual(
      picksBefore(1, 0),
    );
  });

  it('is empty for the first pick and for a swing outside the activation', () => {
    expect(picksBefore(0, 0)).toEqual([]);
    expect(picksBefore(5, 0)).toEqual([]);
  });
});
