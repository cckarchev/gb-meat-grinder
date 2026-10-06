import { describe, expect, it } from 'vitest';
import { getPlaybookResult } from '@/core/playbook/playbookIndex';
import { tackleTakenBeforePick } from '@/core/playbook/tackle';
import { makeAttacker, NO_MODS } from '@/core/testing/fixtures';
import { bucker } from '@/data/attackers/bucker';
import { cast } from '@/data/attackers/cast';
import { thresher } from '@/data/attackers/thresher';
import { veteranBoar } from '@/data/attackers/veteranBoar';
import { veteranCinder } from '@/data/attackers/veteranCinder';

const fixture = makeAttacker();

/** Model with a net-1 `1` line and a net-2 Tackle line. */
const tackleAttacker = makeAttacker({
  playbook: [
    { netSuccesses: 1, results: [getPlaybookResult(fixture, 'one')] },
    {
      netSuccesses: 2,
      results: [{ id: 'tackle', label: 'T', damage: 0, stealsBall: true }],
    },
  ],
});

describe('tackleTakenBeforePick', () => {
  it('allows only the first Tackle in the activation', () => {
    const wrapPicks = [['tackle'], ['tackle']];

    expect(
      tackleTakenBeforePick(tackleAttacker, wrapPicks, 0, 0, NO_MODS, 2),
    ).toBe(false);

    expect(
      tackleTakenBeforePick(tackleAttacker, wrapPicks, 1, 0, NO_MODS, 2),
    ).toBe(true);
  });

  it('counts a Tackle earlier in the same wrap', () => {
    const wrapPicks = [['tackle', 'tackle'], []];

    expect(
      tackleTakenBeforePick(tackleAttacker, wrapPicks, 0, 1, NO_MODS, 2),
    ).toBe(true);
  });

  it('stays available when no earlier pick tackles', () => {
    const wrapPicks = [['one'], ['tackle']];

    expect(
      tackleTakenBeforePick(tackleAttacker, wrapPicks, 1, 0, NO_MODS, 2),
    ).toBe(false);
  });
});

describe('Tackle lines in the card data', () => {
  it('marks every T line as stealing the ball', () => {
    const tacklers = [bucker, cast, thresher, veteranBoar, veteranCinder];

    for (const attacker of tacklers) {
      expect(getPlaybookResult(attacker, 'tackle').stealsBall).toBe(true);
    }
  });
});
