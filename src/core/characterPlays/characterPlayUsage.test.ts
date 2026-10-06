import { describe, expect, it } from 'vitest';
import {
  characterPlayAvailabilityForPick,
  characterPlayUsageBeforePick,
} from '@/core/characterPlays/characterPlayUsage';
import {
  makeAttacker,
  orderFor,
  PLAY_DEF,
  PLAY_REPEATABLE,
  PLAY_TAC,
} from '@/core/testing/fixtures';

describe('character play usage', () => {
  const attacker = makeAttacker();
  const gbTwice = [['gb'], ['gb']];
  const secondSwing = { attackIndex: 1, pickIndex: 0 };

  it('uses up Once Per Turn plays on earlier picks', () => {
    const used = characterPlayUsageBeforePick(
      orderFor(attacker, 2),
      { wrapPicks: gbTwice, characterPlayPicks: [['playTac'], [null]] },
      secondSwing,
    );

    expect([...used]).toEqual(['playTac']);
  });

  it('never uses up plays that are not Once Per Turn', () => {
    const repeatable = makeAttacker({ characterPlays: [PLAY_REPEATABLE] });

    const used = characterPlayUsageBeforePick(
      orderFor(repeatable, 2),
      { wrapPicks: gbTwice, characterPlayPicks: [['playRepeatable'], [null]] },
      secondSwing,
    );

    expect(used.size).toBe(0);
  });

  it('reports which plays remain available', () => {
    const plan = {
      wrapPicks: gbTwice,
      characterPlayPicks: [['playTac'], [null]],
    };

    const availability = characterPlayAvailabilityForPick(
      orderFor(attacker, 2),
      plan,
      secondSwing,
    );

    const single = makeAttacker({ characterPlays: [PLAY_TAC] });

    const depleted = characterPlayAvailabilityForPick(
      orderFor(single, 2),
      plan,
      secondSwing,
    );

    expect(availability).toEqual({ available: [PLAY_DEF], depleted: false });
    expect(depleted).toEqual({ available: [], depleted: true });
  });
});
