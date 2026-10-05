import { describe, expect, it } from 'vitest';
import {
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
} from '@/core/activation/momentum';
import {
  activationAttackIndices,
  attackRowIsActive,
  attackRowIsBerserker,
  baseAttackDealtDamage,
  berserkerSourceBaseIndex,
} from '@/core/attacks/attackRows';
import { characterPlayUsageBeforePick } from '@/core/characterPlays/characterPlayUsage';
import { coverSwingClockIndices } from '@/core/playbook/coverClearing';
import { kdAlreadyTakenBeforePick } from '@/core/playbook/knockDown';
import { damageIfAllHitsWrap } from '@/core/playbook/rowDamage';
import {
  armorReductionBeforeAttack,
  rowEffectsForPick,
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

  it('keeps a fixed base then Berserker clock for cover', () => {
    expect(coverSwingClockIndices(berserker, 2)).toEqual([0, 2, 1, 3]);
    expect(attackRowIsBerserker(berserker, 2)).toBe(true);
    expect(attackRowIsBerserker(berserker, 1)).toBe(false);
    expect(berserkerSourceBaseIndex(berserker, 3)).toBe(1);
  });

  it('knows whether a base dealt damage', () => {
    expect(baseAttackDealtDamage(berserker, ['dodge', 'one'], NO_MODS)).toBe(
      true,
    );

    expect(baseAttackDealtDamage(berserker, ['one'], TOUGH_HIDE)).toBe(false);
  });

  it('projects damage per active row when every pick hits', () => {
    expect(damageIfAllHitsWrap(berserker, wrapPicks, NO_MODS, 2)).toEqual([
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
    expect(
      momentumPoolBeforeBonusTime(
        attacker,
        wrapPicks,
        NO_MODS,
        inactiveRow,
        3,
        [false, false],
        activeBaseCount,
      ),
    ).toBe(3);

    expect(
      momentumAfterAttackInclusive(
        attacker,
        wrapPicks,
        NO_MODS,
        inactiveRow,
        3,
        [false, false],
        activeBaseCount,
      ),
    ).toBe(3);

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
      kdAlreadyTakenBeforePick(
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
      rowEffectsForPick(attacker, [[null]], [[null]], 0, 0, NO_MODS, 1),
    ).toEqual(NO_EFFECTS);
  });
});
