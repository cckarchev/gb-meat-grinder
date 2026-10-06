import { describe, expect, it } from 'vitest';
import { pickEffectsForLaterSwings } from '@/core/playbook/rowEffects';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';

const NO_EFFECTS = {
  tacBonusForLater: 0,
  defReductionForLater: 0,
  armorReduction: 0,
};

describe('plain playbook lines', () => {
  it('treat omitted later-swing bonuses as none', () => {
    const attacker = makeAttacker({
      playbook: [
        {
          netSuccesses: 1,
          results: [{ id: 'bare', label: '1', damage: 1 }],
        },
      ],
    });

    expect(
      pickEffectsForLaterSwings(
        attacker,
        [['bare']],
        [[null]],
        0,
        0,
        NO_MODS,
        1,
        false,
      ),
    ).toEqual(NO_EFFECTS);
  });
});

describe('Knock Down', () => {
  const attacker = makeAttacker();
  const wrapPicks = [['kd'], ['kd']];
  const noPlays = [[null], [null]];

  it('gives later swings -1 DEF only from the first KD', () => {
    expect(
      pickEffectsForLaterSwings(
        attacker,
        wrapPicks,
        noPlays,
        0,
        0,
        NO_MODS,
        2,
        false,
      ),
    ).toEqual({ ...NO_EFFECTS, defReductionForLater: 1 });

    expect(
      pickEffectsForLaterSwings(
        attacker,
        wrapPicks,
        noPlays,
        1,
        0,
        NO_MODS,
        2,
        false,
      ),
    ).toEqual(NO_EFFECTS);
  });

  it('gives nothing when the target starts Knocked Down', () => {
    const enemyKnockedDown = true;

    expect(
      pickEffectsForLaterSwings(
        attacker,
        wrapPicks,
        noPlays,
        0,
        0,
        NO_MODS,
        2,
        enemyKnockedDown,
      ),
    ).toEqual(NO_EFFECTS);
  });
});

describe('character plays in row effects', () => {
  const attacker = makeAttacker();
  const gbTwice = [['gb'], ['gb']];

  it('applies a play once and ignores a repeated Once Per Turn pick', () => {
    expect(
      pickEffectsForLaterSwings(
        attacker,
        gbTwice,
        [['playTac'], ['playTac']],
        1,
        0,
        NO_MODS,
        2,
        false,
      ),
    ).toEqual(NO_EFFECTS);

    expect(
      pickEffectsForLaterSwings(
        attacker,
        gbTwice,
        [['playTac'], ['playDef']],
        1,
        0,
        NO_MODS,
        2,
        false,
      ),
    ).toEqual({ ...NO_EFFECTS, defReductionForLater: 1 });
  });

  it('falls back to the default play on an empty slot', () => {
    expect(
      pickEffectsForLaterSwings(
        attacker,
        gbTwice,
        [[null], [null]],
        0,
        0,
        NO_MODS,
        2,
        false,
      ),
    ).toEqual({ ...NO_EFFECTS, tacBonusForLater: 2 });
  });
});
