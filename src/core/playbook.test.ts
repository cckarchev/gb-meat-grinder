import { describe, expect, it } from 'vitest';
import {
  activationAttackIndices,
  armorReductionBeforeAttack,
  attackRowIsActive,
  attackRowIsBerserker,
  availableBuffs,
  baseAttackDealtDamage,
  berserkerSourceBaseIndex,
  characterPlayAvailabilityForPick,
  characterPlayEffectSummary,
  characterPlayHasEffect,
  characterPlayPickModifiers,
  characterPlayUsageBeforePick,
  coverSwingClockIndices,
  damageIfAllHitsWrap,
  damageModifierBreakdownWrap,
  defaultCharacterPlayId,
  defaultWrapPicks,
  effectiveArmor,
  effectiveEnemyDef,
  effectivePlaybookDamage,
  formatWrapRowSelectionLabel,
  getCharacterPlay,
  getPlaybookResult,
  kdAlreadyTakenBeforePick,
  momentousLineStyle,
  momentumAfterAttackInclusive,
  momentumPoolBeforeBonusTime,
  netSuccessesForChoice,
  pickGeneratesMomentum,
  playbookDamageBonusSum,
  playbookLineDisplayLabel,
  playbookLineDisplaySegments,
  rowEffectsForPick,
  sanitizeBonusTimeFlags,
  sanitizeCharacterPlayPicksWrap,
  specialAbilityFlatDamage,
  wrapExtendedNetNeeded,
  wrapNetThresholdAllHits,
  wrapPickClearsCover,
  wrapSlotBudget,
  wrapSlotCount,
} from '@/core/playbook';
import {
  makeAttacker,
  modsWith,
  NO_MODS,
  PLAY_ARM,
  PLAY_DEF,
  PLAY_NOOP,
  PLAY_REPEATABLE,
  PLAY_TAC,
} from '@/core/testing/fixtures';
import type { CharacterPlay } from '@/types/core/playbook';

const TOUGH_HIDE = modsWith({ toughHide: true });

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

describe('lookups', () => {
  const attacker = makeAttacker();

  it('resolves results, columns and character plays by id', () => {
    expect(getPlaybookResult(attacker, 'two').damage).toBe(2);
    expect(netSuccessesForChoice(attacker, 'kd')).toBe(3);
    expect(getCharacterPlay(attacker, 'playDef')).toBe(PLAY_DEF);
    expect(getCharacterPlay(attacker, null)).toBeUndefined();
  });

  it('throws on unknown playbook ids', () => {
    expect(() => getPlaybookResult(attacker, 'nope')).toThrow();
    expect(() => netSuccessesForChoice(attacker, 'nope')).toThrow();
  });

  it('defaults to the first character play, or null without any', () => {
    expect(defaultCharacterPlayId(attacker)).toBe('playTac');

    expect(defaultCharacterPlayId(makeAttacker({ characterPlays: [] }))).toBe(
      null,
    );
  });

  it('builds one empty slot per row by default', () => {
    expect(defaultWrapPicks(2)).toEqual([[null], [null]]);
  });
});

describe('buffs and damage', () => {
  const attacker = makeAttacker();

  it('excludes buffs the model is the source of', () => {
    const excluding = makeAttacker({ excludedGuildBuffs: ['sunder'] });

    expect(availableBuffs(excluding).map((b) => b.id)).toEqual([
      'sharp',
      'condition',
    ]);
  });

  it('sums the damage bonus of active buffs only', () => {
    expect(playbookDamageBonusSum(attacker, NO_MODS)).toBe(0);

    expect(
      playbookDamageBonusSum(attacker, modsWith({ buffs: { sharp: true } })),
    ).toBe(1);
  });

  it('applies Tough Hide and buffs only to lines with card damage', () => {
    expect(effectivePlaybookDamage(attacker, 0, TOUGH_HIDE)).toBe(0);
    expect(effectivePlaybookDamage(attacker, 2, TOUGH_HIDE)).toBe(1);
    expect(effectivePlaybookDamage(attacker, 1, TOUGH_HIDE)).toBe(0);

    expect(
      effectivePlaybookDamage(
        attacker,
        2,
        modsWith({ toughHide: true, buffs: { sharp: true } }),
      ),
    ).toBe(2);
  });

  it('ignores Tough Hide with a Condition Damage buff', () => {
    const conditionMods = modsWith({
      toughHide: true,
      buffs: { condition: true },
    });

    expect(effectivePlaybookDamage(attacker, 2, conditionMods)).toBe(2);
  });

  it('reduces ARM by active buffs, floored at 0', () => {
    const sunder = modsWith({ buffs: { sunder: true } });

    expect(effectiveArmor(attacker, 2, sunder)).toBe(1);
    expect(effectiveArmor(attacker, 0, sunder)).toBe(0);
  });

  it('lowers DEF for Knocked Down and Snared without a floor', () => {
    expect(effectiveEnemyDef(4, true, true)).toBe(2);
    expect(effectiveEnemyDef(2, true, true)).toBe(0);
    expect(effectiveEnemyDef(7, false, false)).toBe(6);
  });

  it('adds toggled special ability damage', () => {
    const withAbilities = makeAttacker({
      specialAbilities: [
        { id: 'a', label: 'A', tooltip: '', flatDamage: 2 },
        { id: 'b', label: 'B', tooltip: '', flatDamage: 3 },
      ],
    });

    expect(specialAbilityFlatDamage(withAbilities, { b: true })).toBe(3);
    expect(specialAbilityFlatDamage(attacker, { b: true })).toBe(0);
  });
});

describe('momentum', () => {
  const attacker = makeAttacker({ inf: 3 });
  const wrapPicks = [['one', 'two'], ['dodge'], ['four']];
  const bonusTime = [true, false, false];
  const startingMomentum = 1;
  const activeBaseCount = 3;

  it('marks momentous lines by their effective damage', () => {
    expect(momentousLineStyle(attacker, 'one', NO_MODS)).toBe('heat');
    expect(momentousLineStyle(attacker, 'one', TOUGH_HIDE)).toBe('zeroed');
    expect(momentousLineStyle(attacker, 'dodge', NO_MODS)).toBe('none');
    expect(pickGeneratesMomentum(attacker, 'one', TOUGH_HIDE)).toBe(false);
    expect(pickGeneratesMomentum(attacker, null, NO_MODS)).toBe(false);
  });

  it('counts heat picks and Bonus Time spends before a swing', () => {
    // 1 start + 2 heat on row 0 - 1 Bonus Time on row 0 + 0 on row 1.
    expect(
      momentumPoolBeforeBonusTime(
        attacker,
        wrapPicks,
        NO_MODS,
        2,
        startingMomentum,
        bonusTime,
        activeBaseCount,
      ),
    ).toBe(2);
  });

  it('includes the swing itself after it resolves', () => {
    expect(
      momentumAfterAttackInclusive(
        attacker,
        wrapPicks,
        NO_MODS,
        2,
        startingMomentum,
        bonusTime,
        activeBaseCount,
      ),
    ).toBe(3);
  });

  it('clears Bonus Time flags that cannot be paid', () => {
    expect(
      sanitizeBonusTimeFlags(
        attacker,
        [['dodge'], ['one'], ['dodge']],
        NO_MODS,
        0,
        [true, true, true],
        activeBaseCount,
      ),
    ).toEqual([false, false, true]);
  });
});

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

describe('damageModifierBreakdownWrap', () => {
  it('splits card damage into Tough Hide and per-buff contributions', () => {
    const attacker = makeAttacker();
    const mods = modsWith({ toughHide: true, buffs: { sharp: true } });

    expect(
      damageModifierBreakdownWrap(attacker, [['two', 'gb'], ['one']], mods, 2),
    ).toEqual({
      rawCardDamage: 4,
      toughHideReduction: 3,
      buffBonuses: [
        { id: 'sharp', label: 'Sharp', bonus: 3 },
        { id: 'sunder', label: 'Sunder', bonus: 0 },
        { id: 'condition', label: 'Condition', bonus: 0 },
      ],
      totalEffective: 4,
    });
  });
});

describe('Knock Down', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['kd'], ['kd']];
  const noPlays = [[null], [null]];

  it('allows only the first KD in the activation', () => {
    expect(
      kdAlreadyTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2),
    ).toBe(false);

    expect(
      kdAlreadyTakenBeforePick(attacker, wrapPicks, 1, 0, NO_MODS, 2),
    ).toBe(true);

    expect(
      kdAlreadyTakenBeforePick(attacker, wrapPicks, 0, 0, NO_MODS, 2, true),
    ).toBe(true);
  });

  it('gives later swings -1 DEF only from the first KD', () => {
    expect(
      rowEffectsForPick(attacker, wrapPicks, noPlays, 0, 0, NO_MODS, 2),
    ).toEqual({ ...NO_EFFECTS, defReductionForLater: 1 });

    expect(
      rowEffectsForPick(attacker, wrapPicks, noPlays, 1, 0, NO_MODS, 2),
    ).toEqual(NO_EFFECTS);
  });
});

describe('character plays', () => {
  const attacker = makeAttacker();
  const gbTwice = [['gb'], ['gb']];

  it('uses up Once Per Turn plays on earlier picks', () => {
    const used = characterPlayUsageBeforePick(
      attacker,
      gbTwice,
      [['playTac'], [null]],
      1,
      0,
      NO_MODS,
      2,
    );

    expect([...used]).toEqual(['playTac']);
  });

  it('never uses up repeatable plays', () => {
    const repeatable = makeAttacker({ characterPlays: [PLAY_REPEATABLE] });

    const used = characterPlayUsageBeforePick(
      repeatable,
      gbTwice,
      [['playRepeatable'], [null]],
      1,
      0,
      NO_MODS,
      2,
    );

    expect(used.size).toBe(0);
  });

  it('applies a play once and ignores a repeated Once Per Turn pick', () => {
    expect(
      rowEffectsForPick(
        attacker,
        gbTwice,
        [['playTac'], ['playTac']],
        1,
        0,
        NO_MODS,
        2,
      ),
    ).toEqual(NO_EFFECTS);

    expect(
      rowEffectsForPick(
        attacker,
        gbTwice,
        [['playTac'], ['playDef']],
        1,
        0,
        NO_MODS,
        2,
      ),
    ).toEqual({ ...NO_EFFECTS, defReductionForLater: 1 });
  });

  it('falls back to the default play on an empty slot', () => {
    expect(
      rowEffectsForPick(attacker, gbTwice, [[null], [null]], 0, 0, NO_MODS, 2),
    ).toEqual({ ...NO_EFFECTS, tacBonusForLater: 2 });
  });

  it('reports which plays remain available', () => {
    const availability = characterPlayAvailabilityForPick(
      attacker,
      gbTwice,
      [['playTac'], [null]],
      1,
      0,
      NO_MODS,
      2,
    );

    const single = makeAttacker({ characterPlays: [PLAY_TAC] });

    const depleted = characterPlayAvailabilityForPick(
      single,
      gbTwice,
      [['playTac'], [null]],
      1,
      0,
      NO_MODS,
      2,
    );

    expect(availability).toEqual({ available: [PLAY_DEF], depleted: false });
    expect(depleted).toEqual({ available: [], depleted: true });
  });

  it('sanitizes illegal and orphaned play picks', () => {
    const result = sanitizeCharacterPlayPicksWrap(
      attacker,
      [['gb'], ['gb'], ['one']],
      [['playTac'], ['playTac'], ['playDef']],
      NO_MODS,
      3,
    );

    expect(result).toEqual({
      characterPlayPicks: [['playTac'], ['playDef'], [null]],
      changed: true,
    });
  });

  it('caps ARM reduction from earlier plays at 1', () => {
    const repeatableArm: CharacterPlay = { ...PLAY_ARM, repeatable: true };

    const armAttacker = makeAttacker({
      inf: 3,
      characterPlays: [repeatableArm],
    });

    const wrapPicks = [['gb'], ['gb'], ['one']];
    const plays = [['playArm'], ['playArm'], [null]];

    expect(
      armorReductionBeforeAttack(armAttacker, wrapPicks, plays, NO_MODS, 0, 3),
    ).toBe(0);

    expect(
      armorReductionBeforeAttack(armAttacker, wrapPicks, plays, NO_MODS, 2, 3),
    ).toBe(1);
  });

  it('describes play effects and cadence', () => {
    expect(characterPlayHasEffect(PLAY_NOOP)).toBe(false);
    expect(characterPlayHasEffect(PLAY_ARM)).toBe(true);

    expect(
      characterPlayPickModifiers(
        makeAttacker({ characterPlays: [PLAY_ARM] }),
        'playArm',
      ),
    ).toEqual({
      ...NO_EFFECTS,
      armorReduction: 1,
    });

    expect(characterPlayEffectSummary(PLAY_TAC)).toBe(
      '+2 TAC on later attacks. Once per turn.',
    );

    expect(characterPlayEffectSummary(PLAY_REPEATABLE)).toBe(
      '+1 TAC on later attacks. Repeatable.',
    );

    expect(characterPlayEffectSummary(PLAY_NOOP)).toBe(
      'No effect on the attack math. Once per turn.',
    );
  });
});

describe('labels', () => {
  const attacker = makeAttacker();

  it('shows effective damage on numeric and GB lines', () => {
    expect(playbookLineDisplayLabel(attacker, 'two', TOUGH_HIDE)).toBe('1');

    expect(
      playbookLineDisplayLabel(
        attacker,
        'gb',
        modsWith({ buffs: { sharp: true } }),
      ),
    ).toBe('2GB');

    expect(playbookLineDisplayLabel(attacker, 'kd', NO_MODS)).toBe('KD<');
    expect(playbookLineDisplayLabel(attacker, 'push', NO_MODS)).toBe('>');
  });

  it('splits labels into stackable segments', () => {
    expect(playbookLineDisplaySegments(attacker, 'gb', NO_MODS)).toEqual([
      '1',
      'GB',
    ]);

    expect(playbookLineDisplaySegments(attacker, 'kd', NO_MODS)).toEqual([
      'KD',
      '<',
    ]);

    expect(playbookLineDisplaySegments(attacker, 'push', NO_MODS)).toEqual([
      '>',
    ]);
  });

  it('joins the picks of a row for summaries', () => {
    expect(
      formatWrapRowSelectionLabel(attacker, ['push', null, 'two'], NO_MODS),
    ).toBe('> → 2');

    expect(formatWrapRowSelectionLabel(attacker, [null], NO_MODS)).toBe('-');
  });
});

describe('wrap slots', () => {
  const attacker = makeAttacker();

  it('needs one slot per card width of net successes', () => {
    expect(wrapSlotCount(attacker, 0)).toBe(1);
    expect(wrapSlotCount(attacker, 4)).toBe(1);
    expect(wrapSlotCount(attacker, 5)).toBe(2);
    expect(wrapSlotCount(attacker, 9)).toBe(3);
  });

  it('budgets each slot from what is left after full steps', () => {
    expect(wrapSlotBudget(attacker, 9, 0)).toBe(4);
    expect(wrapSlotBudget(attacker, 9, 1)).toBe(4);
    expect(wrapSlotBudget(attacker, 9, 2)).toBe(1);
    expect(wrapSlotBudget(attacker, 4, 1)).toBe(0);
  });

  it('extends net needed past the card width on later slots', () => {
    expect(wrapExtendedNetNeeded(attacker, 1, 2)).toBe(6);
    expect(wrapNetThresholdAllHits(attacker, ['four', 'one'])).toBe(5);
    expect(wrapNetThresholdAllHits(attacker, ['two', null])).toBe(2);
    expect(wrapNetThresholdAllHits(attacker, [])).toBe(0);
  });

  it('knows which picks clear cover', () => {
    expect(wrapPickClearsCover(attacker, 'push')).toBe(true);
    expect(wrapPickClearsCover(attacker, 'two')).toBe(false);
    expect(wrapPickClearsCover(attacker, null)).toBe(false);
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

describe('character play edge cases', () => {
  it('treats a model without plays as having none', () => {
    const playless = makeAttacker({ characterPlays: undefined });

    expect(getCharacterPlay(playless, 'playTac')).toBeUndefined();
    expect(defaultCharacterPlayId(playless)).toBeNull();
  });

  it('describes DEF, ARM and combined effects', () => {
    const combined: CharacterPlay = {
      id: 'combo',
      label: 'Combo',
      tacBonusForLater: 1,
      armorReduction: 1,
    };

    expect(characterPlayEffectSummary(PLAY_DEF)).toBe(
      '−1 enemy DEF on later attacks. Once per turn.',
    );

    expect(characterPlayEffectSummary(PLAY_ARM)).toBe(
      '−1 enemy ARM on later attacks. Once per turn.',
    );

    expect(characterPlayEffectSummary(combined)).toBe(
      '+1 TAC on later attacks; −1 enemy ARM on later attacks. Once per turn.',
    );
  });
});
