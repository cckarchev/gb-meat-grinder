import { describe, expect, it } from 'vitest';
import {
  characterPlayAvailabilityForPick,
  characterPlayUsageBeforePick,
} from '@/core/characterPlays/characterPlayUsage';
import {
  makeAttacker,
  NO_MODS,
  PLAY_DEF,
  PLAY_REPEATABLE,
  PLAY_TAC,
} from '@/core/testing/fixtures';

describe('character play usage', () => {
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

  it('never uses up plays that are not Once Per Turn', () => {
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
});
