import { describe, expect, it } from 'vitest';
import {
  kdAlreadyTakenBeforePick,
  rowEffectsForPick,
} from '@/core/playbook/rowEffects';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

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
