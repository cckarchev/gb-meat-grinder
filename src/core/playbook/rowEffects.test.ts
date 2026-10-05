import { describe, expect, it } from 'vitest';
import type { CharacterPlay } from '@/core/playbook/playbook.types';
import {
  armorReductionBeforeAttack,
  kdAlreadyTakenBeforePick,
  rowEffectsForPick,
} from '@/core/playbook/rowEffects';
import { makeAttacker, NO_MODS, PLAY_ARM } from '@/core/testing/fixtures';

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

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

describe('character plays in row effects', () => {
  const attacker = makeAttacker();
  const gbTwice = [['gb'], ['gb']];

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
});
