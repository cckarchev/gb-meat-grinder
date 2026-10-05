import { describe, expect, it } from 'vitest';
import {
  characterPlayAvailabilityForPick,
  characterPlayEffectSummary,
  characterPlayHasEffect,
  characterPlayPickModifiers,
  characterPlayUsageBeforePick,
  defaultCharacterPlayId,
  getCharacterPlay,
  sanitizeCharacterPlayPicksWrap,
} from '@/core/characterPlayPicks';
import {
  armorReductionBeforeAttack,
  rowEffectsForPick,
} from '@/core/rowEffects';
import {
  makeAttacker,
  NO_MODS,
  PLAY_ARM,
  PLAY_DEF,
  PLAY_NOOP,
  PLAY_REPEATABLE,
  PLAY_TAC,
} from '@/core/testing/fixtures';
import type { CharacterPlay } from '@/types/core/playbook';

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

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
